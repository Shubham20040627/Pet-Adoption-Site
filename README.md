# PawConnect — Pet Adoption Platform 🐾

> **"Find Your Best Friend. Give Them a Forever Home."**  
> **Academic Project:** B.Tech Django CA2 Evaluation  
> **Architecture:** Full-Stack (React + Vite + Django REST Framework + MongoDB with PyMongo)

---

## 🌟 Project Overview

**PawConnect** is a modern, ethical, and fully functional pet adoption platform. It connects prospective adopters with verified animal rescue shelters, providing transparent medical histories, educational readiness checks, rule-based lifestyle pet matching, and real-time adoption workflow tracking.

All core application collections (Users, Shelters, Pets, Adoption Applications, Favorites, Notifications, and Contact Messages) are stored directly in **MongoDB** using **PyMongo**, with zero reliance on SQLite for business data.

---

## 🎯 Key Unique Features

### 1. 🔍 PawMatch: Rule-Based Pet Matching Engine
- Interactive 5-question lifestyle questionnaire evaluating:
  - Preferred species (Dog, Cat, Rabbit, Bird, Any)
  - Desired pet size (Small, Medium, Large)
  - Daily activity & exercise level (Low, Moderate, High)
  - Housing space (Apartment vs. House with Yard)
  - Household environment (Children, other pets)
- Uses a deterministic, rule-based scoring engine in Python (no external black-box AI required).
- Explains **why** each pet matches the adopter (e.g., *"Direct species match"*, *"Apartment friendly size"*, *"Safe around children"*).

### 2. ✅ Pet Adoption Readiness Checklist
- Interactive 5-category self-assessment covering:
  1. Daily Time & Exercise Commitment (2+ hours/day)
  2. Financial Budget & Emergency Veterinary cushion
  3. Living Environment & Pet-Proofed Housing
  4. Household & Family Agreement
  5. Long-term 10-15+ year responsibility
- Dynamic real-time progress indicator (0% to 100%) and personalized readiness advice badges (*Getting Ready*, *Almost Ready*, *Ready for Adoption!*).

### 3. 📊 Visual Application Status Tracker
- Interactive multi-stage progress stepper showing live milestones:
  - **Stage 1:** Submitted (Application received)
  - **Stage 2:** Under Review (Shelter evaluating living environment)
  - **Stage 3:** Approved or Rejected (With custom shelter feedback notes)
  - **Stage 4:** Completed (Adoption finalized and pet handover complete)
- Adopters can withdraw applications while in pending stages.
- In-app notification alerts automatically trigger when shelters update application status.

---

## 👥 Role-Based Access Control

| Feature | Public Visitor | Adopter | Shelter / Rescue |
| :--- | :---: | :---: | :---: |
| Browse & Search Pets | ✅ | ✅ | ✅ |
| Filter by Species, Age, Size | ✅ | ✅ | ✅ |
| Take PawMatch Quiz | ✅ | ✅ | ✅ |
| Adoption Readiness Checklist | ✅ | ✅ | ✅ |
| Save Favorite Pets | ❌ (Redirects to Login) | ✅ | ❌ |
| Submit Adoption Application | ❌ (Redirects to Login) | ✅ | ❌ |
| Visual Application Tracker | ❌ | ✅ | ❌ |
| In-App Notification Alerts | ❌ | ✅ | ✅ |
| Add / Edit / Archive Pet Listings | ❌ | ❌ | ✅ |
| Review Applications & Decide | ❌ | ❌ | ✅ |
| Shelter Operations Dashboard | ❌ | ❌ | ✅ |
| Contact Form (MongoDB) | ✅ | ✅ | ✅ |

---

## 🛠️ Technology Stack

- **Frontend:**
  - React 18 with Vite
  - JavaScript (ES6+)
  - React Router DOM v7
  - Axios (with JWT interceptors)
  - Lucide React Icons
  - Pure External CSS with Design Tokens & Variables (Forest Green `#1B4332`, White, and Warm Cream `#FAF7F2`)
- **Backend:**
  - Python 3.14 & Django 6.1
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
│   │   ├── __init__.py
│   │   ├── settings.py         # DRF, CORS, Media & App configs
│   │   ├── urls.py             # Root API routing
│   │   ├── wsgi.py
│   │   ├── mongodb.py          # Centralized PyMongo connector & helpers
│   │   └── auth.py             # JWT authentication & role permissions
│   ├── apps/
│   │   ├── accounts/           # Auth, Registration, Login, Profile
│   │   ├── pets/               # Pet CRUD, Filtering, PawMatch Engine
│   │   ├── adoptions/          # Applications, Status Updates, Tracking
│   │   ├── shelters/           # Shelter Dashboard metrics & profiles
│   │   └── common/             # Favorites, Notifications, Contact, Readiness
│   ├── media/                  # Uploaded pet photos
│   ├── manage.py
│   ├── requirements.txt
│   ├── seed_data.py            # MongoDB demo seeder
│   ├── .env                    # Active backend environment variables
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios API services
│   │   ├── components/         # Navbar, Footer, PetCard, StatusTracker, etc.
│   │   ├── context/            # AuthContext (state, favorites, alerts)
│   │   ├── pages/              # Home, Browse, Details, Dashboards, Quiz, etc.
│   │   ├── styles/             # Modular CSS design files
│   │   ├── App.jsx             # React Router routing
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── run_backend.bat             # One-click Windows starter for Backend
├── run_frontend.bat            # One-click Windows starter for Frontend
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.14)
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
3. Populate demo data into MongoDB:
   ```bash
   python seed_data.py
   ```
4. Start the Django development server:
   ```bash
   python manage.py runserver 8000
   ```
   *The API will be available at `http://localhost:8000/api/`*

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

## 🔑 Demo Accounts (For 1-Click College Evaluation)

Both accounts can be filled with a single click using the **"1-Click Demo Accounts"** helper buttons on the Login page (`/login`):

| Role | Email | Password | What to Test |
| :--- | :--- | :--- | :--- |
| **Adopter** | `adopter@pawconnect.org` | `password123` | Browse pets, take PawMatch quiz, view active Status Tracker for Bella, save favorites, submit new applications. |
| **Shelter** | `shelter@pawconnect.org` | `password123` | Real-time MongoDB metrics, approve/reject applications with feedback notes, list new pets with photo uploads. |

---

## 🎓 Viva / Evaluation Highlights (For College Presentation)

1. **How is MongoDB integrated with Django?**
   - We implemented a centralized connector `config/mongodb.py` using PyMongo.
   - All collections (`users`, `shelters`, `pets`, `applications`, `favorites`, `notifications`, `contact_messages`) are queried using native PyMongo methods (`find`, `insert_one`, `update_one`).
   - A custom `MongoJWTAuthentication` class verifies JWT tokens against `db.users`, providing seamless compatibility with Django REST Framework request permissions.
2. **How does PawMatch work?**
   - Located in `apps/pets/matching.py`, it calculates a transparent 100-point compatibility score comparing adopter preferences (species, size, activity, household) against pet records.
   - It attaches human-readable explanation tags showing the exact reasons for the match.
3. **How does the Application Status Tracker work?**
   - The `applications` collection stores a `status` field (`submitted`, `under_review`, `approved`, `rejected`, `completed`) along with a `status_history` list containing timestamps and shelter notes.
   - When a shelter updates an application's status from their dashboard, the change persists in MongoDB and immediately reflects on the adopter's dashboard with an in-app notification.
4. **Is the contact form functional?**
   - Yes! The contact form sends messages to `/api/contact/`, which are saved in the `contact_messages` collection in MongoDB.
5. **Live Health & Database Verification Endpoint:**
   - Evaluators can open `http://localhost:8000/api/health/` in the browser or Postman to inspect real-time MongoDB connection status and live document counts across all collections.
