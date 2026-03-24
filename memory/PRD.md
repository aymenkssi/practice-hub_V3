# Practice-Hub V2 (MockExamCenter) - PRD

## Original Problem Statement
Charger le projet GitHub practice-hub_V2 et configurer avec les variables PayPal pour créer une plateforme d'examen.

## Architecture
- **Backend**: FastAPI (Python) - Port 8001
- **Frontend**: React + TailwindCSS + Radix UI - Port 3000
- **Database**: MongoDB (local)
- **Payment**: PayPal Integration (Sandbox)

## User Personas
1. **Candidats** - Utilisateurs passant des examens de certification
2. **Administrateurs** - Gestion des examens, questions, coupons et analytics

## Core Requirements (Static)
- Authentification JWT (register/login)
- Gestion des catégories et examens
- Questions avec domaines et explications
- Paiement PayPal (accès single ou all-access)
- Coupons de réduction
- Résultats et statistiques par domaine
- Admin dashboard avec analytics

## What's Been Implemented
- [2026-03-24] Initial setup from GitHub repository
- [2026-03-24] PayPal configuration (sandbox mode)
- [2026-03-24] MongoDB connection configured
- [2026-03-24] Admin user created

## Environment Variables
### Backend (.env)
- MONGO_URL, DB_NAME
- PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_MODE
- JWT_SECRET, CORS_ORIGINS

### Frontend (.env)
- REACT_APP_BACKEND_URL

## Prioritized Backlog
### P0 (Critical)
- ✅ Project setup and deployment

### P1 (High)
- Create exam categories
- Add exams and import questions
- Test PayPal payment flow

### P2 (Medium)
- Switch to PayPal live mode for production
- Add more certifications (AWS, Azure, etc.)
- Email notifications

## Next Tasks
1. Access admin panel and create categories
2. Create exams within categories
3. Import questions (JSON format)
4. Test complete user flow (register → purchase → exam → results)
