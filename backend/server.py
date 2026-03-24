from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import json
import random
from passlib.context import CryptContext
from jose import jwt, JWTError
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="MockExamCenter API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# Auth Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str
    subscription: Optional[Dict[str, Any]] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Category Models
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    icon: Optional[str] = "BookOpen"
    order: int = 0

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    order: int
    exam_count: int = 0
    created_at: str

# Exam Models
class DomainWeight(BaseModel):
    name: str
    weight: int  # percentage

class ExamCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    category_id: str
    duration_minutes: int = 120
    question_count: int = 100
    passing_score: int = 700
    max_score: int = 1000
    domains: List[DomainWeight] = []
    price_single: float = 9.99  # Monthly access to this exam
    price_all_access: float = 29.99  # Access to all exams
    access_duration_days: int = 30
    is_active: bool = True

class ExamResponse(BaseModel):
    id: str
    name: str
    description: str
    category_id: str
    category_name: Optional[str] = ""
    duration_minutes: int
    question_count: int
    passing_score: int
    max_score: int
    domains: List[Dict[str, Any]]
    price_single: float
    price_all_access: float
    access_duration_days: int
    is_active: bool
    total_questions: int = 0
    created_at: str

# Question Models
class QuestionCreate(BaseModel):
    exam_id: str
    domain: str
    question: str
    choices: List[str]
    correct_answer: int
    explanation: str

class QuestionResponse(BaseModel):
    id: str
    exam_id: str
    domain: str
    question: str
    choices: List[str]
    correct_answer: Optional[int] = None  # Hidden for non-purchased users
    explanation: Optional[str] = None  # Hidden for non-purchased users

# Coupon Models
class CouponCreate(BaseModel):
    code: str
    discount_percent: int  # 0-100
    valid_until: Optional[str] = None
    max_uses: Optional[int] = None
    exam_id: Optional[str] = None  # None = applies to all

class CouponResponse(BaseModel):
    id: str
    code: str
    discount_percent: int
    valid_until: Optional[str]
    max_uses: Optional[int]
    uses_count: int
    exam_id: Optional[str]
    is_active: bool
    created_at: str

# Subscription Models
class SubscriptionCreate(BaseModel):
    exam_id: Optional[str] = None  # None = all access
    payment_id: str
    coupon_code: Optional[str] = None

# Pricing Settings
class PricingSettings(BaseModel):
    all_access_price: float
    all_access_duration_days: int
    all_access_lifetime_price: float = 99.99

# Exam Result Models
class ExamResultCreate(BaseModel):
    exam_id: str
    questions: List[Dict[str, Any]]
    answers: List[Dict[str, Any]]
    time_spent: int
    completed: bool = True

class ExamResultResponse(BaseModel):
    id: str
    exam_id: str
    exam_name: str
    user_id: str
    score: int
    passed: bool
    total_questions: int
    correct_answers: int
    time_spent: int
    domain_stats: List[Dict[str, Any]]
    created_at: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    return user

async def get_admin_user(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès administrateur requis")
    return user

async def check_user_access(user: dict, exam_id: str) -> dict:
    """Check if user has access to an exam. Returns access info."""
    subscription = user.get("subscription")
    
    # Free preview: 10 questions
    if not subscription:
        return {"has_access": False, "preview_only": True, "preview_count": 10}
    
    # Check if subscription is expired
    expires_at = subscription.get("expires_at")
    if expires_at:
        if datetime.fromisoformat(expires_at) < datetime.now(timezone.utc):
            return {"has_access": False, "preview_only": True, "preview_count": 10, "expired": True}
    
    # All access subscription
    if subscription.get("type") == "all_access":
        return {"has_access": True, "preview_only": False}
    
    # Single exam subscription
    if subscription.get("type") == "single" and subscription.get("exam_id") == exam_id:
        return {"has_access": True, "preview_only": False}
    
    return {"has_access": False, "preview_only": True, "preview_count": 10}

def calculate_domain_stats(questions: List[Dict], answers: List[Dict]) -> List[Dict]:
    domain_data = {}
    for q in questions:
        domain = q.get("domain", "Unknown")
        if domain not in domain_data:
            domain_data[domain] = {"total": 0, "correct": 0}
        domain_data[domain]["total"] += 1
    
    answer_map = {a["question_id"]: a for a in answers}
    for q in questions:
        domain = q.get("domain", "Unknown")
        q_id = q.get("id")
        answer = answer_map.get(q_id)
        if answer and answer.get("is_correct"):
            domain_data[domain]["correct"] += 1
    
    stats = []
    for domain, data in domain_data.items():
        percentage = (data["correct"] / data["total"] * 100) if data["total"] > 0 else 0
        stats.append({
            "domain": domain,
            "total": data["total"],
            "correct": data["correct"],
            "percentage": round(percentage, 1)
        })
    return stats

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Create user
    user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "role": "user",
        "subscription": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    # Create token
    token = create_access_token({"sub": user["id"]})
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"],
        subscription=user["subscription"]
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    token = create_access_token({"sub": user["id"]})
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=user["created_at"],
        subscription=user.get("subscription")
    )
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

# ==================== CATEGORY ROUTES ====================

@api_router.post("/admin/categories", response_model=CategoryResponse)
async def create_category(data: CategoryCreate, admin: dict = Depends(get_admin_user)):
    category = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "description": data.description,
        "icon": data.icon,
        "order": data.order,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.categories.insert_one(category)
    return CategoryResponse(**category, exam_count=0)

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    result = []
    for cat in categories:
        exam_count = await db.exams.count_documents({"category_id": cat["id"], "is_active": True})
        result.append(CategoryResponse(**cat, exam_count=exam_count))
    return result

@api_router.put("/admin/categories/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, data: CategoryCreate, admin: dict = Depends(get_admin_user)):
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": {"name": data.name, "description": data.description, "icon": data.icon, "order": data.order}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    exam_count = await db.exams.count_documents({"category_id": category_id})
    return CategoryResponse(**category, exam_count=exam_count)

@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, admin: dict = Depends(get_admin_user)):
    # Check if category has exams
    exam_count = await db.exams.count_documents({"category_id": category_id})
    if exam_count > 0:
        raise HTTPException(status_code=400, detail=f"Impossible de supprimer: {exam_count} examens liés")
    
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    return {"message": "Catégorie supprimée"}

# ==================== EXAM ROUTES ====================

@api_router.post("/admin/exams", response_model=ExamResponse)
async def create_exam(data: ExamCreate, admin: dict = Depends(get_admin_user)):
    # Verify category exists
    category = await db.categories.find_one({"id": data.category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    
    exam = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "description": data.description,
        "category_id": data.category_id,
        "duration_minutes": data.duration_minutes,
        "question_count": data.question_count,
        "passing_score": data.passing_score,
        "max_score": data.max_score,
        "domains": [d.model_dump() for d in data.domains],
        "price_single": data.price_single,
        "price_all_access": data.price_all_access,
        "access_duration_days": data.access_duration_days,
        "is_active": data.is_active,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.exams.insert_one(exam)
    return ExamResponse(**exam, category_name=category["name"], total_questions=0)

@api_router.get("/exams", response_model=List[ExamResponse])
async def get_exams(category_id: Optional[str] = None):
    query = {"is_active": True}
    if category_id:
        query["category_id"] = category_id
    
    exams = await db.exams.find(query, {"_id": 0}).to_list(100)
    result = []
    for exam in exams:
        category = await db.categories.find_one({"id": exam["category_id"]}, {"_id": 0})
        total_questions = await db.questions.count_documents({"exam_id": exam["id"]})
        result.append(ExamResponse(
            **exam,
            category_name=category["name"] if category else "",
            total_questions=total_questions
        ))
    return result

@api_router.get("/admin/exams", response_model=List[ExamResponse])
async def get_all_exams_admin(admin: dict = Depends(get_admin_user)):
    exams = await db.exams.find({}, {"_id": 0}).to_list(100)
    result = []
    for exam in exams:
        category = await db.categories.find_one({"id": exam["category_id"]}, {"_id": 0})
        total_questions = await db.questions.count_documents({"exam_id": exam["id"]})
        result.append(ExamResponse(
            **exam,
            category_name=category["name"] if category else "",
            total_questions=total_questions
        ))
    return result

@api_router.get("/exams/{exam_id}", response_model=ExamResponse)
async def get_exam(exam_id: str):
    exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Examen non trouvé")
    category = await db.categories.find_one({"id": exam["category_id"]}, {"_id": 0})
    total_questions = await db.questions.count_documents({"exam_id": exam_id})
    return ExamResponse(**exam, category_name=category["name"] if category else "", total_questions=total_questions)

@api_router.put("/admin/exams/{exam_id}", response_model=ExamResponse)
async def update_exam(exam_id: str, data: ExamCreate, admin: dict = Depends(get_admin_user)):
    update_data = {
        "name": data.name,
        "description": data.description,
        "category_id": data.category_id,
        "duration_minutes": data.duration_minutes,
        "question_count": data.question_count,
        "passing_score": data.passing_score,
        "max_score": data.max_score,
        "domains": [d.model_dump() for d in data.domains],
        "price_single": data.price_single,
        "price_all_access": data.price_all_access,
        "access_duration_days": data.access_duration_days,
        "is_active": data.is_active
    }
    result = await db.exams.update_one({"id": exam_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Examen non trouvé")
    return await get_exam(exam_id)

@api_router.delete("/admin/exams/{exam_id}")
async def delete_exam(exam_id: str, admin: dict = Depends(get_admin_user)):
    # Delete related questions
    await db.questions.delete_many({"exam_id": exam_id})
    result = await db.exams.delete_one({"id": exam_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Examen non trouvé")
    return {"message": "Examen et questions supprimés"}

# ==================== QUESTION ROUTES ====================

@api_router.post("/admin/questions/import")
async def import_questions(exam_id: str, questions: List[Dict[str, Any]], admin: dict = Depends(get_admin_user)):
    # Verify exam exists
    exam = await db.exams.find_one({"id": exam_id})
    if not exam:
        raise HTTPException(status_code=404, detail="Examen non trouvé")
    
    imported = 0
    duplicates = 0
    
    for q in questions:
        # Check for duplicates
        existing = await db.questions.find_one({"exam_id": exam_id, "question": q.get("question")})
        if existing:
            duplicates += 1
            continue
        
        question = {
            "id": str(uuid.uuid4()),
            "exam_id": exam_id,
            "domain": q.get("domain", ""),
            "question": q.get("question", ""),
            "choices": q.get("choices", []),
            "correct_answer": q.get("correctAnswer", q.get("correct_answer", 0)),
            "explanation": q.get("explanation", ""),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.questions.insert_one(question)
        imported += 1
    
    return {"imported": imported, "duplicates": duplicates, "message": f"{imported} questions importées"}

@api_router.get("/admin/questions/{exam_id}")
async def get_exam_questions_admin(exam_id: str, admin: dict = Depends(get_admin_user)):
    questions = await db.questions.find({"exam_id": exam_id}, {"_id": 0}).to_list(1000)
    return {"questions": questions, "total": len(questions)}

@api_router.delete("/admin/questions/{exam_id}")
async def delete_exam_questions(exam_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.questions.delete_many({"exam_id": exam_id})
    return {"message": f"{result.deleted_count} questions supprimées"}

@api_router.get("/exams/{exam_id}/preview")
async def get_preview_questions(exam_id: str, user: dict = Depends(get_current_user)):
    """Get 10 preview questions without answers"""
    questions = await db.questions.find({"exam_id": exam_id}, {"_id": 0}).to_list(1000)
    
    if len(questions) == 0:
        return {"questions": [], "count": 0, "preview": True}
    
    # Get 10 random questions
    preview = random.sample(questions, min(10, len(questions)))
    
    # Remove answers and explanations for preview
    for q in preview:
        q.pop("correct_answer", None)
        q.pop("explanation", None)
    
    return {"questions": preview, "count": len(preview), "preview": True}

@api_router.get("/exams/{exam_id}/questions")
async def get_exam_questions(exam_id: str, user: dict = Depends(get_current_user)):
    """Get exam questions for full access users"""
    access = await check_user_access(user, exam_id)
    
    if not access["has_access"]:
        # Return preview only
        return await get_preview_questions(exam_id, user)
    
    # Get exam config
    exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Examen non trouvé")
    
    # Get random questions based on exam config
    questions = await db.questions.find({"exam_id": exam_id}, {"_id": 0}).to_list(1000)
    
    if len(questions) == 0:
        raise HTTPException(status_code=400, detail="Aucune question disponible")
    
    # Select random questions
    count = min(exam["question_count"], len(questions))
    selected = random.sample(questions, count)
    
    return {
        "questions": selected,
        "count": len(selected),
        "duration_minutes": exam["duration_minutes"],
        "passing_score": exam["passing_score"],
        "max_score": exam["max_score"],
        "preview": False
    }

# ==================== COUPON ROUTES ====================

@api_router.post("/admin/coupons", response_model=CouponResponse)
async def create_coupon(data: CouponCreate, admin: dict = Depends(get_admin_user)):
    # Check if code exists
    existing = await db.coupons.find_one({"code": data.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Code déjà existant")
    
    coupon = {
        "id": str(uuid.uuid4()),
        "code": data.code.upper(),
        "discount_percent": min(100, max(0, data.discount_percent)),
        "valid_until": data.valid_until,
        "max_uses": data.max_uses,
        "uses_count": 0,
        "exam_id": data.exam_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.coupons.insert_one(coupon)
    return CouponResponse(**coupon)

@api_router.get("/admin/coupons", response_model=List[CouponResponse])
async def get_coupons(admin: dict = Depends(get_admin_user)):
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(100)
    return [CouponResponse(**c) for c in coupons]

@api_router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, admin: dict = Depends(get_admin_user)):
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon non trouvé")
    return {"message": "Coupon supprimé"}

@api_router.post("/coupons/validate")
async def validate_coupon(code: str, exam_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    coupon = await db.coupons.find_one({"code": code.upper(), "is_active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon invalide")
    
    # Check expiration
    if coupon.get("valid_until"):
        try:
            # Handle date string (YYYY-MM-DD) from frontend
            valid_until_str = coupon["valid_until"]
            if "T" in valid_until_str:
                valid_until = datetime.fromisoformat(valid_until_str.replace("Z", "+00:00"))
            else:
                # Date only format from input type="date"
                valid_until = datetime.strptime(valid_until_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            
            if valid_until < datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Coupon expiré")
        except ValueError:
            pass  # Invalid date format, skip expiration check
    
    # Check max uses
    if coupon.get("max_uses") and coupon["uses_count"] >= coupon["max_uses"]:
        raise HTTPException(status_code=400, detail="Coupon épuisé")
    
    # Check exam restriction
    if coupon.get("exam_id") and exam_id and coupon["exam_id"] != exam_id:
        raise HTTPException(status_code=400, detail="Coupon non valide pour cet examen")
    
    return {"valid": True, "discount_percent": coupon["discount_percent"], "code": coupon["code"]}

# ==================== PAYMENT ROUTES ====================

@api_router.post("/payments/create-order")
async def create_payment_order(
    exam_id: Optional[str] = None,
    access_type: str = "single",  # single, single_lifetime, all_access, all_access_lifetime
    coupon_code: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Create a PayPal order for subscription"""
    import httpx
    
    is_lifetime = access_type.endswith("_lifetime")
    settings = await db.settings.find_one({"type": "pricing"}, {"_id": 0}) or {}
    
    # Get pricing
    if access_type in ("single", "single_lifetime") and exam_id:
        exam = await db.exams.find_one({"id": exam_id}, {"_id": 0})
        if not exam:
            raise HTTPException(status_code=404, detail="Examen non trouvé")
        if is_lifetime:
            price = exam.get("price_lifetime", 0)
            duration_days = 0
            description = f"Accès à vie - {exam['name']}"
        else:
            price = exam["price_single"]
            duration_days = exam.get("access_duration_days", 30)
            description = f"Accès à l'examen: {exam['name']}"
    else:
        # All access
        if is_lifetime:
            price = settings.get("all_access_lifetime_price", 99.99)
            duration_days = 0
            description = "Accès à vie - Tous les examens"
            access_type = "all_access_lifetime"
        else:
            price = settings.get("all_access_price", 29.99)
            duration_days = settings.get("all_access_duration_days", 30)
            description = "Accès à tous les examens"
            access_type = "all_access"
    
    # Apply coupon
    discount = 0
    if coupon_code:
        coupon = await db.coupons.find_one({"code": coupon_code.upper(), "is_active": True}, {"_id": 0})
        if coupon:
            discount = coupon["discount_percent"]
    
    final_price = round(price * (1 - discount / 100), 2)
    
    # Create internal order record
    internal_order_id = str(uuid.uuid4())
    order = {
        "id": internal_order_id,
        "user_id": user["id"],
        "exam_id": exam_id,
        "access_type": access_type,
        "original_price": price,
        "discount_percent": discount,
        "final_price": final_price,
        "coupon_code": coupon_code,
        "duration_days": duration_days,
        "description": description,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)
    
    # If price is 0 (100% coupon), auto-activate
    if final_price == 0:
        # Auto activate subscription
        expires_at = datetime.now(timezone.utc) + timedelta(days=duration_days)
        subscription = {
            "type": access_type,
            "exam_id": exam_id if access_type == "single" else None,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at.isoformat(),
            "order_id": internal_order_id
        }
        await db.users.update_one({"id": user["id"]}, {"$set": {"subscription": subscription}})
        await db.orders.update_one({"id": internal_order_id}, {"$set": {"status": "completed", "paypal_order_id": "FREE_COUPON"}})
        
        if coupon_code:
            await db.coupons.update_one({"code": coupon_code.upper()}, {"$inc": {"uses_count": 1}})
        
        return {
            "order_id": internal_order_id,
            "paypal_order_id": None,
            "amount": 0,
            "currency": "EUR",
            "description": description,
            "discount_applied": discount,
            "free_access": True
        }
    
    # Create PayPal order
    paypal_client_id = os.environ.get("PAYPAL_CLIENT_ID", "")
    paypal_secret = os.environ.get("PAYPAL_SECRET", "")
    paypal_mode = os.environ.get("PAYPAL_MODE", "sandbox")
    
    if not paypal_client_id or not paypal_secret:
        raise HTTPException(status_code=500, detail="PayPal non configuré")
    
    base_url = "https://api-m.sandbox.paypal.com" if paypal_mode == "sandbox" else "https://api-m.paypal.com"
    
    try:
        async with httpx.AsyncClient() as client:
            # Get access token
            auth_response = await client.post(
                f"{base_url}/v1/oauth2/token",
                auth=(paypal_client_id, paypal_secret),
                data={"grant_type": "client_credentials"},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            auth_data = auth_response.json()
            access_token = auth_data.get("access_token")
            
            if not access_token:
                logger.error(f"PayPal auth failed: {auth_data}")
                raise HTTPException(status_code=500, detail="Erreur d'authentification PayPal")
            
            # Create order
            order_response = await client.post(
                f"{base_url}/v2/checkout/orders",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json={
                    "intent": "CAPTURE",
                    "purchase_units": [{
                        "reference_id": internal_order_id,
                        "description": description,
                        "amount": {
                            "currency_code": "EUR",
                            "value": str(final_price)
                        }
                    }]
                }
            )
            
            paypal_order = order_response.json()
            paypal_order_id = paypal_order.get("id")
            
            if not paypal_order_id:
                logger.error(f"PayPal order creation failed: {paypal_order}")
                raise HTTPException(status_code=500, detail="Erreur création commande PayPal")
            
            # Update our order with PayPal ID
            await db.orders.update_one(
                {"id": internal_order_id},
                {"$set": {"paypal_order_id": paypal_order_id}}
            )
            
            return {
                "order_id": internal_order_id,
                "paypal_order_id": paypal_order_id,
                "amount": final_price,
                "currency": "EUR",
                "description": description,
                "discount_applied": discount,
                "free_access": False
            }
            
    except httpx.RequestError as e:
        logger.error(f"PayPal request error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de connexion PayPal: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected PayPal error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur PayPal inattendue: {str(e)}")

@api_router.post("/payments/capture/{order_id}")
async def capture_payment(order_id: str, paypal_order_id: str, user: dict = Depends(get_current_user)):
    """Capture payment and activate subscription"""
    import httpx
    
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    
    if order["status"] != "pending":
        raise HTTPException(status_code=400, detail="Commande déjà traitée")
    
    # Capture PayPal payment
    paypal_client_id = os.environ.get("PAYPAL_CLIENT_ID", "")
    paypal_secret = os.environ.get("PAYPAL_SECRET", "")
    paypal_mode = os.environ.get("PAYPAL_MODE", "sandbox")
    base_url = "https://api-m.sandbox.paypal.com" if paypal_mode == "sandbox" else "https://api-m.paypal.com"
    
    try:
        async with httpx.AsyncClient() as client:
            # Get access token
            auth_response = await client.post(
                f"{base_url}/v1/oauth2/token",
                auth=(paypal_client_id, paypal_secret),
                data={"grant_type": "client_credentials"},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            access_token = auth_response.json().get("access_token")
            
            # Capture the order
            capture_response = await client.post(
                f"{base_url}/v2/checkout/orders/{paypal_order_id}/capture",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            capture_data = capture_response.json()
            
            if capture_data.get("status") != "COMPLETED":
                logger.error(f"PayPal capture failed: {capture_data}")
                raise HTTPException(status_code=400, detail="Paiement non complété")
    
    except httpx.RequestError as e:
        logger.error(f"PayPal capture error: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur de capture PayPal")
    
    # Update order status
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "completed", "paypal_order_id": paypal_order_id, "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update coupon usage
    if order.get("coupon_code"):
        await db.coupons.update_one(
            {"code": order["coupon_code"]},
            {"$inc": {"uses_count": 1}}
        )
    
    # Create subscription
    is_lifetime_order = order["access_type"].endswith("_lifetime")
    if is_lifetime_order:
        expires_at = None
    else:
        expires_at = (datetime.now(timezone.utc) + timedelta(days=order["duration_days"])).isoformat()
    
    subscription = {
        "type": "all_access" if "all_access" in order["access_type"] else "single",
        "exam_id": order.get("exam_id"),
        "lifetime": is_lifetime_order,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at,
        "order_id": order_id
    }
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"subscription": subscription}}
    )
    
    return {"success": True, "subscription": subscription}

# ==================== PRICING SETTINGS ====================

@api_router.get("/admin/settings/pricing")
async def get_pricing_settings(admin: dict = Depends(get_admin_user)):
    settings = await db.settings.find_one({"type": "pricing"}, {"_id": 0})
    if not settings:
        settings = {
            "type": "pricing",
            "all_access_price": 29.99,
            "all_access_duration_days": 30,
            "all_access_lifetime_price": 99.99
        }
    return settings

@api_router.get("/settings/pricing")
async def get_public_pricing_settings():
    settings = await db.settings.find_one({"type": "pricing"}, {"_id": 0})
    if not settings:
        settings = {
            "all_access_price": 29.99,
            "all_access_duration_days": 30,
            "all_access_lifetime_price": 99.99
        }
    return settings


@api_router.put("/admin/settings/pricing")
async def update_pricing_settings(data: PricingSettings, admin: dict = Depends(get_admin_user)):
    settings = {
        "type": "pricing",
        "all_access_price": data.all_access_price,
        "all_access_duration_days": data.all_access_duration_days,
        "all_access_lifetime_price": data.all_access_lifetime_price,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.settings.update_one({"type": "pricing"}, {"$set": settings}, upsert=True)
    return settings

@api_router.get("/settings/paypal")
async def get_paypal_client_id():
    """Get PayPal client ID and mode for frontend"""
    client_id = os.environ.get("PAYPAL_CLIENT_ID", "")
    mode = os.environ.get("PAYPAL_MODE", "sandbox")
    return {"client_id": client_id, "mode": mode}

# ==================== ADMIN USERS ====================

@api_router.get("/admin/users")
async def get_admin_users(admin: dict = Depends(get_admin_user)):
    """Get all registered users for admin panel"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    return users

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Admin: delete a user and all associated data"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Impossible de supprimer un administrateur")
    
    await db.orders.delete_many({"user_id": user_id})
    await db.exam_results.delete_many({"user_id": user_id})
    await db.users.delete_one({"id": user_id})
    return {"message": "Utilisateur supprimé"}

# ==================== USER ORDERS HISTORY ====================

@api_router.get("/user/orders")
async def get_user_orders(user: dict = Depends(get_current_user)):
    """Get user's payment/order history"""
    orders = await db.orders.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return orders

# ==================== ADMIN ANALYTICS ====================

@api_router.get("/admin/analytics")
async def get_admin_analytics(admin: dict = Depends(get_admin_user)):
    """Get detailed analytics for admin dashboard"""
    from collections import defaultdict
    
    # Basic counts
    total_users = await db.users.count_documents({})
    total_exams = await db.exams.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_results = await db.exam_results.count_documents({})
    
    # Revenue
    completed_orders = await db.orders.find(
        {"status": "completed"}, {"_id": 0}
    ).to_list(5000)
    total_revenue = sum(o.get("final_price", 0) for o in completed_orders)
    
    # Monthly revenue (last 12 months)
    monthly_revenue = defaultdict(float)
    monthly_orders = defaultdict(int)
    for order in completed_orders:
        if order.get("created_at"):
            month_key = order["created_at"][:7]  # "2026-03"
            monthly_revenue[month_key] += order.get("final_price", 0)
            monthly_orders[month_key] += 1
    
    # Sort by month
    sorted_months = sorted(monthly_revenue.keys())[-12:]
    revenue_chart = [
        {"month": m, "revenue": round(monthly_revenue[m], 2), "orders": monthly_orders[m]}
        for m in sorted_months
    ]
    
    # User growth (last 12 months)
    users = await db.users.find({}, {"_id": 0, "created_at": 1}).to_list(10000)
    monthly_users = defaultdict(int)
    for u in users:
        if u.get("created_at"):
            month_key = u["created_at"][:7]
            monthly_users[month_key] += 1
    sorted_user_months = sorted(monthly_users.keys())[-12:]
    users_chart = [
        {"month": m, "users": monthly_users[m]}
        for m in sorted_user_months
    ]
    
    # Exam popularity (by number of results)
    exams = await db.exams.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
    exam_stats = []
    for exam in exams:
        results_count = await db.exam_results.count_documents({"exam_id": exam["id"]})
        orders_count = await db.orders.count_documents({"exam_id": exam["id"], "status": "completed"})
        exam_revenue = sum(
            o.get("final_price", 0) for o in completed_orders if o.get("exam_id") == exam["id"]
        )
        exam_stats.append({
            "id": exam["id"],
            "name": exam["name"],
            "results": results_count,
            "orders": orders_count,
            "revenue": round(exam_revenue, 2)
        })
    exam_stats.sort(key=lambda x: x["results"], reverse=True)
    
    # Recent orders (last 20)
    recent_orders = await db.orders.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    # Enrich with user names
    for order in recent_orders:
        u = await db.users.find_one({"id": order.get("user_id")}, {"_id": 0, "name": 1, "email": 1})
        order["user_name"] = u.get("name", "Inconnu") if u else "Inconnu"
        order["user_email"] = u.get("email", "") if u else ""
    
    # Access type distribution
    access_types = defaultdict(int)
    for o in completed_orders:
        access_types[o.get("access_type", "unknown")] += 1
    
    return {
        "totals": {
            "users": total_users,
            "exams": total_exams,
            "orders": total_orders,
            "results": total_results,
            "revenue": round(total_revenue, 2),
            "completed_orders": len(completed_orders)
        },
        "revenue_chart": revenue_chart,
        "users_chart": users_chart,
        "exam_stats": exam_stats,
        "recent_orders": recent_orders,
        "access_types": dict(access_types)
    }

@api_router.get("/admin/orders")
async def get_admin_orders(admin: dict = Depends(get_admin_user)):
    """Get all orders for admin"""
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for order in orders:
        u = await db.users.find_one({"id": order.get("user_id")}, {"_id": 0, "name": 1, "email": 1})
        order["user_name"] = u.get("name", "Inconnu") if u else "Inconnu"
        order["user_email"] = u.get("email", "") if u else ""
    return orders

# ==================== USER PURCHASED EXAMS ====================

@api_router.get("/user/purchased-exams")
async def get_user_purchased_exams(user: dict = Depends(get_current_user)):
    """Get exams the user has access to via subscription or completed orders"""
    subscription = user.get("subscription")
    purchased_exams = []

    # Get completed orders for this user
    orders = await db.orders.find(
        {"user_id": user["id"], "status": "completed"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    # Collect exam IDs from orders
    exam_ids_from_orders = set()
    has_all_access = False
    for order in orders:
        if order.get("access_type") == "all_access":
            has_all_access = True
        elif order.get("exam_id"):
            exam_ids_from_orders.add(order["exam_id"])

    # Also check current subscription
    if subscription:
        if subscription.get("type") == "all_access":
            has_all_access = True
        elif subscription.get("type") == "single" and subscription.get("exam_id"):
            exam_ids_from_orders.add(subscription["exam_id"])

    # Fetch exams
    if has_all_access:
        exams = await db.exams.find({}, {"_id": 0}).to_list(100)
    elif exam_ids_from_orders:
        exams = await db.exams.find({"id": {"$in": list(exam_ids_from_orders)}}, {"_id": 0}).to_list(100)
    else:
        exams = []

    # Check access status for each exam
    for exam in exams:
        access = await check_user_access(user, exam["id"])
        # Get latest result for this exam
        latest_result = await db.exam_results.find_one(
            {"user_id": user["id"], "exam_id": exam["id"]},
            {"_id": 0},
            sort=[("completed_at", -1)]
        )
        purchased_exams.append({
            "id": exam["id"],
            "name": exam["name"],
            "category_id": exam.get("category_id"),
            "duration_minutes": exam.get("duration_minutes"),
            "question_count": exam.get("question_count"),
            "passing_score": exam.get("passing_score"),
            "max_score": exam.get("max_score", 1000),
            "has_access": access["has_access"],
            "expired": access.get("expired", False),
            "latest_score": latest_result.get("score") if latest_result else None,
            "latest_passed": latest_result.get("passed") if latest_result else None,
            "attempts_count": await db.exam_results.count_documents({"user_id": user["id"], "exam_id": exam["id"]})
        })

    # Subscription info
    sub_info = None
    if subscription:
        is_expired = False
        if subscription.get("expires_at"):
            is_expired = datetime.fromisoformat(subscription["expires_at"]) < datetime.now(timezone.utc)
        sub_info = {
            "type": subscription.get("type"),
            "expires_at": subscription.get("expires_at"),
            "is_expired": is_expired
        }

    return {
        "subscription": sub_info,
        "exams": purchased_exams,
        "orders_count": len(orders)
    }

# ==================== GDPR: DATA EXPORT & ACCOUNT DELETION ====================

@api_router.get("/user/export-data")
async def export_user_data(user: dict = Depends(get_current_user)):
    """GDPR: Export all user data in JSON format"""
    user_id = user["id"]

    user_data = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).to_list(500)
    results = await db.exam_results.find({"user_id": user_id}, {"_id": 0}).to_list(500)

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": user_data,
        "orders": orders,
        "exam_results": results
    }

@api_router.delete("/user/account")
async def delete_user_account(user: dict = Depends(get_current_user)):
    """GDPR: Delete user account and all associated data"""
    user_id = user["id"]

    await db.orders.delete_many({"user_id": user_id})
    await db.exam_results.delete_many({"user_id": user_id})
    await db.users.delete_one({"id": user_id})

    return {"message": "Account and all associated data deleted successfully"}

# ==================== EXAM RESULTS ====================

@api_router.post("/results")
async def save_exam_result(data: ExamResultCreate, user: dict = Depends(get_current_user)):
    """Save exam result"""
    exam = await db.exams.find_one({"id": data.exam_id}, {"_id": 0})
    if not exam:
        raise HTTPException(status_code=404, detail="Examen non trouvé")
    
    # Calculate score
    correct_count = sum(1 for a in data.answers if a.get("is_correct", False))
    total = len(data.questions)
    score = int((correct_count / total) * exam["max_score"]) if total > 0 else 0
    passed = score >= exam["passing_score"]
    
    domain_stats = calculate_domain_stats(data.questions, data.answers)
    
    result = {
        "id": str(uuid.uuid4()),
        "exam_id": data.exam_id,
        "exam_name": exam["name"],
        "user_id": user["id"],
        "score": score,
        "passed": passed,
        "total_questions": total,
        "correct_answers": correct_count,
        "time_spent": data.time_spent,
        "domain_stats": domain_stats,
        "questions": data.questions,
        "answers": data.answers,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.results.insert_one(result)
    
    return ExamResultResponse(**{k: v for k, v in result.items() if k != "questions" and k != "answers"})

@api_router.get("/results", response_model=List[ExamResultResponse])
async def get_user_results(user: dict = Depends(get_current_user)):
    results = await db.results.find(
        {"user_id": user["id"]},
        {"_id": 0, "questions": 0, "answers": 0}
    ).sort("created_at", -1).to_list(100)
    return [ExamResultResponse(**r) for r in results]

@api_router.get("/results/{result_id}")
async def get_result_details(result_id: str, user: dict = Depends(get_current_user)):
    result = await db.results.find_one(
        {"id": result_id, "user_id": user["id"]},
        {"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Résultat non trouvé")
    return result

# ==================== ADMIN STATS ====================

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    users_count = await db.users.count_documents({"role": "user"})
    exams_count = await db.exams.count_documents({})
    questions_count = await db.questions.count_documents({})
    results_count = await db.results.count_documents({})
    orders_count = await db.orders.count_documents({"status": "completed"})
    
    # Revenue calculation
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$final_price"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "users": users_count,
        "exams": exams_count,
        "questions": questions_count,
        "results": results_count,
        "orders": orders_count,
        "revenue": round(total_revenue, 2)
    }

# ==================== INIT ADMIN ====================

@api_router.post("/init-admin")
async def init_admin():
    """Initialize admin user if not exists"""
    admin_email = "admin@mockexamcenter.com"
    existing = await db.users.find_one({"email": admin_email})
    
    if existing:
        return {"message": "Admin déjà existant", "created": False}
    
    admin = {
        "id": str(uuid.uuid4()),
        "email": admin_email,
        "name": "Administrator",
        "password": hash_password("Aymenkabildridikssi!1807"),
        "role": "admin",
        "subscription": {"type": "all_access", "expires_at": None},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin)
    return {"message": "Admin créé", "created": True, "email": admin_email}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "MockExamCenter API", "version": "2.0"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.categories.create_index("id", unique=True)
    await db.exams.create_index("id", unique=True)
    await db.questions.create_index("exam_id")
    await db.coupons.create_index("code", unique=True)
    await db.orders.create_index("user_id")
    await db.results.create_index("user_id")
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
