"""
Backend API Tests for GDPR and i18n Features
Tests: User registration, login, data export, account deletion
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://paypal-payment-test.preview.emergentagent.com')

# Test user credentials
TEST_USER_EMAIL = f"test_gdpr_{uuid.uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "TestPassword123!"
TEST_USER_NAME = "GDPR Test User"

# Admin credentials
ADMIN_EMAIL = "admin@mockexamcenter.com"
ADMIN_PASSWORD = "Aymenkabildridikssi!1807"


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "MockExamCenter API"
        print("✓ API root endpoint working")

    def test_categories_endpoint(self):
        """Test public categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        print("✓ Categories endpoint working")

    def test_exams_endpoint(self):
        """Test public exams endpoint"""
        response = requests.get(f"{BASE_URL}/api/exams")
        assert response.status_code == 200
        print("✓ Exams endpoint working")

    def test_pricing_endpoint(self):
        """Test public pricing endpoint"""
        response = requests.get(f"{BASE_URL}/api/settings/pricing")
        assert response.status_code == 200
        data = response.json()
        assert "single_exam_price" in data
        assert "all_access_price" in data
        print("✓ Pricing endpoint working")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print("✓ Admin login successful")
        return data["access_token"]

    def test_user_registration(self):
        """Test new user registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        assert data["user"]["name"] == TEST_USER_NAME
        assert data["user"]["role"] == "user"
        print(f"✓ User registration successful: {TEST_USER_EMAIL}")
        return data["access_token"]

    def test_duplicate_registration_fails(self):
        """Test that duplicate email registration fails"""
        # First register
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"dup_{TEST_USER_EMAIL}",
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        })
        # Try to register again with same email
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"dup_{TEST_USER_EMAIL}",
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        })
        assert response.status_code == 400
        print("✓ Duplicate registration correctly rejected")

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")


class TestGDPRFeatures:
    """GDPR compliance feature tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for test user"""
        # Register a new user for GDPR tests
        email = f"gdpr_test_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_USER_PASSWORD,
            "name": "GDPR Test"
        })
        if response.status_code == 200:
            return response.json()["access_token"], email
        # If registration fails, try login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": TEST_USER_PASSWORD
        })
        return response.json()["access_token"], email

    def test_export_data_endpoint(self, auth_token):
        """Test GDPR data export endpoint"""
        token, email = auth_token
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/user/export-data", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify export structure
        assert "exported_at" in data
        assert "user" in data
        assert "orders" in data
        assert "exam_results" in data
        
        # Verify user data is included
        assert data["user"]["email"] == email
        print(f"✓ Data export successful for {email}")
        print(f"  - Exported at: {data['exported_at']}")
        print(f"  - Orders count: {len(data['orders'])}")
        print(f"  - Results count: {len(data['exam_results'])}")

    def test_export_data_requires_auth(self):
        """Test that data export requires authentication"""
        response = requests.get(f"{BASE_URL}/api/user/export-data")
        assert response.status_code in [401, 403]
        print("✓ Data export correctly requires authentication")

    def test_delete_account_endpoint(self):
        """Test GDPR account deletion endpoint"""
        # Create a new user specifically for deletion test
        email = f"delete_test_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_USER_PASSWORD,
            "name": "Delete Test User"
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Delete the account
        response = requests.delete(f"{BASE_URL}/api/user/account", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Account deletion successful for {email}")
        
        # Verify user can no longer login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": TEST_USER_PASSWORD
        })
        assert login_response.status_code == 401
        print("✓ Deleted user cannot login anymore")

    def test_delete_account_requires_auth(self):
        """Test that account deletion requires authentication"""
        response = requests.delete(f"{BASE_URL}/api/user/account")
        assert response.status_code in [401, 403]
        print("✓ Account deletion correctly requires authentication")


class TestUserPurchasedExams:
    """Test user purchased exams endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for test user"""
        email = f"purchased_test_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_USER_PASSWORD,
            "name": "Purchased Test"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": TEST_USER_PASSWORD
        })
        return response.json()["access_token"]

    def test_purchased_exams_endpoint(self, auth_token):
        """Test user purchased exams endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.get(f"{BASE_URL}/api/user/purchased-exams", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "subscription" in data
        assert "exams" in data
        assert "orders_count" in data
        print("✓ Purchased exams endpoint working")
        print(f"  - Subscription: {data['subscription']}")
        print(f"  - Exams count: {len(data['exams'])}")


class TestAuthMe:
    """Test /auth/me endpoint"""
    
    def test_auth_me_with_valid_token(self):
        """Test getting current user info"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        print("✓ Auth/me endpoint working")

    def test_auth_me_without_token(self):
        """Test /auth/me without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]
        print("✓ Auth/me correctly requires authentication")


class TestCouponValidation:
    """Test coupon validation endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]

    def test_invalid_coupon(self, auth_token):
        """Test validating an invalid coupon"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/coupons/validate?code=INVALIDCODE123",
            headers=headers
        )
        assert response.status_code == 404
        print("✓ Invalid coupon correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
