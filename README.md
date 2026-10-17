# PawConnect — Pet Adoption Platform 🐾

> **"Find Your Best Friend. Give Them a Forever Home."**  
> **Academic Project:** B.Tech Django Full-Stack Evaluation  
> **Architecture:** Full-Stack (React + Vite + Django REST Framework + MongoDB with PyMongo)

---

## 🌟 Project Overview

**PawConnect** is an ethical, full-featured pet adoption and animal welfare platform. It connects prospective adopters with verified animal rescue shelters, providing transparent clinical medical histories, an interactive adoption readiness assessment, rule-based lifestyle pet matching, multi-stage application workflows, official digital adoption agreements, and centralized administrator moderation.

All core application collections (Users, Shelters, Pets, Adoption Applications, Favorites, Notifications, Contact Messages, and Certificates) are stored directly in **MongoDB** using **PyMongo**, with zero reliance on SQLite for business data.

---

## 🎯 Key Unique Features

### 1. 🔍 PawMatch: Rule-Based Pet Matching Engine
- Interactive lifestyle questionnaire evaluating:
  - Preferred species (Dog, Cat, Rabbit, Bird, Any)
  - Desired pet size (Small, Medium, Large)
  - Daily activity & exercise level (Low, Moderate, High)
  - Housing space (Apartment vs. House with Yard)
  - Household environment (Children, other pets)
- Deterministic, rule-based scoring engine in Python (transparent, verifiable algorithms).
- Explains **why** each pet matches the adopter (e.g., *"Direct species match"*, *"Apartment friendly size"*, *"Safe around children"*).

### 2. 🛡️ Adoption Readiness Assessment & Official Verified Badge
- Academic, scenario-based evaluation testing real-life pet parenting:
  1. **Daily Schedule & Care** (feeding routines, outdoor exercise, active companionship)
  2. **Healthcare & Budget Planning** (routine wellness checks and emergency reserves)
  3. **Patience & Adjustment** (The 3-3-3 rule for rescue decompression)
  4. **Home Safety & Household Agreement** (pet-proofing and family consensus)
  5. **Lifelong Responsibility** (10–15+ year commitment through life transitions)
- **80% Passing Threshold**: Requires at least 4 out of 5 responsible answers to earn certification.
  - **Passing (≥80%)**: Grants the official **PawConnect Verified Ready Adopter** badge and generates a printable certificate with a unique Credential ID.
  - **Below Threshold (<80%)**: Delivers educational recommendations and invites the adopter to review and retake the evaluation.
- **Platform-Wide Integration**: Verified badge appears on the Adopter's Profile, Overview Dashboard, Applications, and is prominently showcased to shelters during review.

### 3. 🏥 Digital Care Profiles & Veterinary Health Passports
- Acts as an official pre-adoption veterinary record book for every pet:
  - **Vaccination Status & Schedule**: Core vaccines (Rabies, DHPP, Bordetella) with status badges.
  - **Deworming History**: Complete course tracking with the exact last administration date.
  - **Sterilization Status**: Certified Spayed / Neutered badges.
  - **Clinical Examination & Vitals**: Last veterinary check date and healthy vitals confirmation.
  - **Next Recommended Due Date**: Scheduled booster shot alerts.
  - **Special Care & Diet Guidelines**: Alerts for dietary restrictions or medication needs.
- **Interactive Dialog Box**: Adopters can view records on the pet detail page without scrolling by clicking the **"📋 View Health & Care Passport (Dialog)"** button.
- **Shelter Records Management**: Shelters can update care records anytime when listing or editing pets.

### 4. 📊 Visual Application Status Tracker & Notifications
- Interactive multi-stage progress stepper showing live milestones:
  - **Stage 1:** Submitted (Application received)
  - **Stage 2:** Under Review (Shelter evaluating living environment)
  - **Stage 3:** Approved or Rejected (With custom shelter feedback notes)
  - **Stage 4:** Completed (Adoption finalized and pet handover complete)
- In-app notification alerts automatically trigger when shelters update application status.

### 5. 📜 Official Adoption Certificates & Legal Agreements
- Approved adoptions unlock an official **Certificate of Adoption** and a signed **Digital Adoption Agreement** with verification codes.
- Public verification portal at `/verify-certificate` allows third parties to verify certificate authenticity.

### 6. 🛡️ Administrator Portal & Shelter Verification System
- Dedicated super-admin portal for platform governance:
  - **Shelter Onboarding Verification**: Review new shelter registrations, inspection records, and AWBI licenses before granting portal access.
  - **Pending Security Screen**: Unapproved shelters cannot access management tools; they see a real-time review screen until approved by the admin.
  - **Platform-Wide Metrics**: Centralized metrics for active shelters, pending reviews, registered adopters, total pets, and approved adoptions.
  - **Account Status Controls**: Admins can approve, reject, activate, or suspend shelter accounts.

---

## 👥 Role-Based Access Control (RBAC)

| Feature | Public Visitor | Adopter | Shelter / Rescue | Platform Admin |
| :--- | :---: | :---: | :---: | :---: |
| Browse & Search Pets | ✅ | ✅ | ✅ | ✅ |
| Take PawMatch Quiz | ✅ | ✅ | ✅ | ✅ |
| Take Readiness Assessment | ✅ | ✅ | ❌ | ❌ |
| Earn & View Verified Adopter Badge | ❌ | ✅ | ❌ | ❌ |
| View Digital Care Profile Passports | ✅ | ✅ | ✅ | ✅ |
| Save Favorites | ❌ | ✅ | ❌ | ❌ |
| Submit Adoption Application | ❌ | ✅ | ❌ | ❌ |
| Visual Application Tracker | ❌ | ✅ | ❌ | ❌ |
| Schedule Meet & Greet Visits | ❌ | ✅ | ✅ | ❌ |
| Add / Edit / Archive Pet Listings | ❌ | ❌ | ✅ | ❌ |
| Manage Pet Digital Care Records | ❌ | ❌ | ✅ | ❌ |
| Review Applications & Decide | ❌ | ❌ | ✅ | ❌ |
| Generate Official Certificates | ❌ | ❌ | ✅ | ✅ |
| Access Shelter Operations Dashboard | ❌ | ❌ | ✅ (If Approved) | ❌ |
| **Approve / Reject Shelter Applications** | ❌ | ❌ | ❌ | ✅ |
| **Access Central Admin Dashboard (`/admin-dashboard`)** | ❌ | ❌ | ❌ | ✅ |
| **View System-Wide MongoDB Audit Metrics** | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Technology Stack

- **Frontend:**
  - React 18 with Vite
  - JavaScript (ES6+)
  - React Router DOM v7
  - Axios (with JWT interceptors)
  - Lucide React Icons
  - Pure CSS Design System with CSS Tokens & Variables (Forest Green `#0E3628`, Emerald `#10B981`, Warm Cream `#FAF7F2`)
- **Backend:**
  - Python 3.10+ / 3.14 & Django 6.1
  - Django REST Framework (DRF)
  - PyJWT for role-based token authentication
  - PyMongo 4.18 as the centralized database connector
  - Django CORS Headers
- **Database:**
  - **MongoDB** (Local instance: `mongodb://localhost:27017/`)
  - Database name: `pawconnect_db`

---

## 📂 Project Directory Structure

```text
DjangoProject/
├── backend/
│   ├── config/
│   │   ├── settings.py             # DRF, CORS, Media & App configs
│   │   ├── urls.py                 # Root API routing
│   │   ├── mongodb.py              # Centralized PyMongo connector & helpers
│   │   └── auth.py                 # JWT authentication & role permissions
│   ├── apps/
│   │   ├── accounts/               # Auth, Registration, Login, Profile
│   │   ├── admin_portal/           # Admin Dashboard, Shelter Approvals, Platform Stats
│   │   ├── pets/                   # Pet CRUD, Digital Care Profiles, PawMatch Engine
│   │   ├── adoptions/              # Applications, Visits, Certificates, Agreements
│   │   ├── shelters/               # Shelter Dashboard metrics & profiles
│   │   └── common/                 # Favorites, Notifications, Contact, Readiness
│   ├── enrich_care_profiles.py     # MongoDB seeder for clinical care profiles
│   ├── setup_admin.py              # Platform admin account initializer
│   ├── seed_data.py                # Full MongoDB demo seeder
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/                    # Axios API services (adminApi, shelterApi, petsApi, etc.)
│   │   ├── components/             # DigitalCareProfileModal, VerifiedAdopterBadgeCard, etc.
│   │   ├── context/                # AuthContext (JWT, user state, role guards)
│   │   ├── pages/                  # AdminDashboardPage, ShelterDashboardPage, PetDetailPage, etc.
│   │   ├── styles/                 # Modular CSS (care-profile.css, verified-badge.css, etc.)
│   │   ├── App.jsx                 # React Router protected routing
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── run_backend.bat                 # One-click Windows starter for Backend
├── run_frontend.bat                # One-click Windows starter for Frontend
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm
- **MongoDB** running locally on port `27017`

### 2. Backend Setup
1. Open a terminal in `backend/`:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Initialize demo data, admin, and care profiles in MongoDB:
   ```bash
   python seed_data.py
   python setup_admin.py
   python enrich_care_profiles.py
   ```
4. Start the Django development server:
   ```bash
   python manage.py runserver 8000
   ```
   *The API will be live at `http://localhost:8000/api/`*

### 3. Frontend Setup
1. In another terminal, navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will open at `http://localhost:5173/`*

---

## 🔑 Demo Accounts (For College Evaluation)

Use these pre-configured credentials on the Login page (`http://localhost:5173/login`):

| Role | Email | Password | Features to Test |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `admin@pawconnect.org` | `admin123` | **Admin Dashboard (`/admin-dashboard`)**: Review and approve new shelter registration requests, toggle shelter access, inspect system-wide MongoDB metrics across all shelters and adopters. |
| **Rescue Shelter** | `shelter@pawconnect.org` | `password123` | **Shelter Dashboard (`/shelter-dashboard`)**: Manage pet listings, update clinical digital care passports, review applications with applicant Verified Badges, issue certificates. |
| **Adopter** | `adopter@pawconnect.org` | `password123` | **Adopter Portal (`/adopter_dashboard`)**: Take the Readiness Assessment, earn the Verified Adopter Badge, browse pets, view Health Passports via interactive dialogs, track applications. |

---

## 🎓 Viva & Academic Evaluation Highlights

1. **How is the Administrator Portal architected?**
   - The Admin Portal is powered by the `apps/admin_portal/` backend module with strict `@permission_classes([IsAdminUser])` guards.
   - When new shelters register, their status is set to `is_approved: false`. Admins review their registration number, facility type, and contact details from `/admin-dashboard` and approve or reject them with a single click.
2. **How is MongoDB integrated without SQLite?**
   - All collections (`users`, `shelters`, `pets`, `applications`, `favorites`, `notifications`, `certificates`) are queried directly via `config/mongodb.py` using PyMongo.
   - A custom JWT authentication middleware (`MongoJWTAuthentication`) validates tokens against `db.users`.
3. **How does the Digital Care Profile Passport work?**
   - Stored directly on each pet's MongoDB document (`vaccination_status`, `deworming_status`, `sterilization_status`, `last_health_check_date`, `next_vaccination_date`, `microchip_number`).
   - Adopters inspect records through an animated modal dialog (`DigitalCareProfileModal.jsx`) that blurs the background and opens instantly without scrolling.
4. **How does the Adoption Readiness Assessment calculate scores?**
   - The assessment evaluates 5 practical scenarios with weighted points.
   - A strict 80% passing threshold ensures that only prepared applicants unlock the official **PawConnect Verified Ready Adopter** badge and unique credential ID (`PC-READY-XXXXXX`).
5. **Live Health & System Inspection:**
   - Evaluators can open `http://localhost:8000/api/health/` to inspect real-time MongoDB connectivity and collection document counts.
