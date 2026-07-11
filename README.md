# TERRITORY - Land Marketplace PWA

> A secure, full-stack Progressive Web App for buying and selling verified agricultural and flat land plots in Tamil Nadu, India. Built for **direct seller-to-buyer** transactions with KYC verification, document locking behind a payment gateway, and a comprehensive admin control panel.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup and Running Locally](#setup-and-running-locally)
- [User Roles and Flows](#user-roles-and-flows)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Current Project State](#current-project-state)
- [Known Limitations and Future Roadmap](#known-limitations-and-future-roadmap)
- [Developer Notes for AI Agents](#developer-notes-for-ai-agents)

---

## Architecture Overview

```
Browser (React PWA) :5173
       |  Axios / REST / Firebase JWT
FastAPI Backend :8000
       |  Motor (async)
MongoDB (local / Atlas)
```

**Authentication Flow:**
1. User signs in via Firebase Auth (email/password).
2. Frontend gets a Firebase ID token and stores it in localStorage.
3. Axios request interceptor attaches `Authorization: Bearer <token>` on every API call.
4. FastAPI backend verifies the token via `firebase-admin` SDK.
5. Axios response interceptor catches 401 -> clears token -> redirects to /login.
6. ProtectedRoute component checks token + role before rendering protected pages.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 + Vanilla CSS |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Backend Framework | FastAPI |
| ASGI Server | Uvicorn |
| Database Driver | Motor (async MongoDB) |
| Auth | Firebase Auth + firebase-admin SDK |
| Database | MongoDB |

---

## Project Structure

```
TERRITORY/
+-- backend/
|   +-- main.py                 # FastAPI app, CORS config, indexes
|   +-- database.py             # Motor async client + Firebase init
|   +-- models.py               # Pydantic models (Property, User, etc.)
|   +-- create_admin.py         # Seed admin user script
|   +-- create_test_accounts.py # Seed buyer/seller/admin via Firebase
|   +-- seed_properties.py      # Populate DB with 20 sample properties
|   +-- requirements.txt        # Python dependencies
|   +-- .env                    # Secrets (gitignored)
|   +-- .env.example            # Template
|   +-- routers/
|       +-- auth.py             # Register, Login, /me, Wishlist + JWT
|       +-- properties.py       # CRUD + filtered search + recommendations
|       +-- payments.py         # Mock unlock + buyer view
|       +-- admin.py            # Admin stats, users, properties
|
+-- frontend/
    +-- src/
        +-- App.tsx             # Router + ProtectedRoute config
        +-- lib/
        |   +-- api.ts          # Axios + auth interceptors
        |   +-- types.ts        # TypeScript interfaces and constants
        |   +-- utils.ts        # formatPrice, formatArea, shortId
        +-- components/
        |   +-- ProtectedRoute.tsx
        |   +-- TextType.tsx    # Typing animation component
        |   +-- layout/
        |       +-- Navbar.tsx  # Auth-aware with Buy->Browse nav
        |       +-- Footer.tsx
        +-- pages/
            +-- NotFound.tsx
            +-- SellGuide.tsx   # Guided sell onboarding for guests
            +-- Help.tsx        # FAQ page
            +-- Contact.tsx     # Contact page
            +-- auth/           # Login, RegisterBuyer, RegisterSeller
            +-- buyer/          # Home, Browse, PropertyDetails, Dashboard, SecureViewer, Wishlist
            +-- seller/         # Dashboard, UploadProperty, EditProperty
            +-- admin/          # Dashboard
```

---

## Setup and Running Locally

### Prerequisites
- Python 3.11+
- Node.js 20+ (a bundled node-v20 directory is included in the repo)
- MongoDB running locally OR MongoDB Atlas connection string

### 1. Clone

```bash
git clone https://github.com/vishalsathya87/PropIt.git
cd PropIt
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Mac/Linux  (Windows: .\venv\Scripts\activate)
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set MONGODB_URL and DATABASE_NAME
python create_test_accounts.py # Creates admin/buyer/seller in Firebase + MongoDB
python seed_properties.py      # Populates DB with 20 sample properties
uvicorn main:app --reload      # Runs at http://localhost:8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                    # Runs at http://localhost:5173
```

### 4. Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@propit.com | adminpassword |
| Buyer | buyer@propit.com | buyerpassword |
| Seller | seller@propit.com | sellerpassword |

### 5. Test the App

1. Log in as Seller, list a property with all details.
2. Log in as Buyer, browse, filter, and click "Pay Rs.500 and Unlock" (demo).
3. Log in as Admin to view platform stats and manage users/properties.

---

## User Roles and Flows

| Role | Registration | Capabilities |
|---|---|---|
| Buyer | Email + Password | Browse, filter/search, recommendations, wishlist, mock-unlock properties, view unlocked docs |
| Seller | Email + Password + KYC | List properties with 15+ land details, edit listings, view engagement stats |
| Admin | Via create_test_accounts.py | Platform stats, user management, property overview |

---

## API Reference

### Auth - /api/v1/auth/
- `POST /register` - Register Buyer or Seller
- `GET /me` - Current user info (Bearer required)
- `GET /wishlist` - Get user's wishlist property IDs
- `POST /wishlist/{property_id}` - Toggle property in/out of wishlist
- `GET /wishlist/properties` - Get full property objects for wishlist items

### Properties - /api/v1/properties/
- `GET /` - List ACTIVE properties with filters: type, city, district, min_price, max_price, min_area, max_area, water_source, road_access, soil_type, electricity, irrigation, search
- `GET /recommendations` - **Smart recommendation engine** (optional `district`, `city`, `limit` params). Returns location-matched -> most-viewed -> newest fallback.
- `GET /seller/me` - Seller's own listings (Seller JWT)
- `GET /seller/me/stats` - Seller's unlock counts and revenue (Seller JWT)
- `GET /{id}` - Get property by ID (increments view_count)
- `POST /` - Create property (Seller JWT, multipart with images + documents)
- `PUT /{id}` - Update property (Seller/Admin JWT, multipart)

### Payments - /api/v1/payments/
- `POST /mock-unlock` - Simulate Rs.500 unlock (Buyer JWT)
- `GET /unlocked-properties` - Buyer's unlocked properties (Buyer JWT)

### Admin - /api/v1/admin/
- `GET /stats` - Platform stats incl. revenue (Admin JWT)
- `GET /users` - All users (Admin JWT)
- `GET /properties` - All properties (Admin JWT)

---

## Environment Variables

### Backend (.env)

| Variable | Default | Description |
|---|---|---|
| MONGODB_URL | mongodb://localhost:27017 | MongoDB connection string |
| DATABASE_NAME | propit | Database name |
| ALLOWED_ORIGINS | http://localhost:5173 | Comma-separated CORS origins |
| FIREBASE_SERVICE_ACCOUNT_PATH | firebase-service-account.json | Path to Firebase service account |

### Frontend (.env.local)

| Variable | Default | Description |
|---|---|---|
| VITE_API_URL | http://localhost:8000/api/v1 | Backend API base URL |

---

## Current Project State

### What Works
- Firebase auth (email/password) with JWT token verification
- Full property listing with 15+ searchable land features
- Server-side filtered search (10+ filter parameters)
- **Smart recommendation engine** - location-based -> most popular -> newest fallback
- **Browse page** with search, sort, type pills, and expandable filters
- Wishlist (add/remove properties, persisted per-user)
- Mock payment gateway (Rs.500 demo unlock)
- Buyer dashboard showing unlocked properties
- Secure document viewer with anti-copy protections and user watermark
- Seller dashboard with edit functionality and engagement stats
- Admin dashboard with platform stats, users, and property management
- Role-based route protection (ProtectedRoute component)
- Auth-aware Navbar with direct Buy->Browse navigation
- Mobile-responsive design throughout
- DB seed script with 20 sample properties across Tamil Nadu
- 404 Not Found page, Help center, Contact page, Sell Guide

### Known Limitations (Prototype)

| Limitation | Production Fix |
|---|---|
| Mock payment only | Integrate Razorpay / PhonePe |
| KYC not actually verified | Integrate DigiLocker or NSDL Aadhaar API |
| No OTP on registration | Integrate MSG91 or Twilio |

---

## Known Limitations and Future Roadmap

### Phase 6 - Real Payment
Integrate Razorpay (sandbox). Verify webhook server-side before unlocking.

### Phase 7 - Cloud Document Storage
Store documents on Cloudinary/S3. Return signed short-expiry URLs for SecureViewer.

### Phase 8 - Real KYC and OTP
OTP on registration via MSG91. Admin approve/reject KYC in Admin Dashboard.

### Phase 9 - Deployment
- Frontend: Vercel (connect GitHub, set VITE_API_URL)
- Backend: Railway.app or Render.com
- Database: MongoDB Atlas M0 (free, 512MB)

### Phase 10 - PWA
Add vite-plugin-pwa, service worker, push notifications for saved search matches.

---

## Developer Notes for AI Agents

### Critical Patterns

1. **Route Ordering (FastAPI):** In routers/properties.py, `/seller/me`, `/seller/me/stats`, and `/recommendations` MUST be defined BEFORE `/{property_id}` - FastAPI is first-match and would treat those as property IDs.

2. **Tailwind v4:** Uses @tailwindcss/postcss in postcss.config.js, `@import "tailwindcss"` in index.css, custom colors in `@theme { --color-primary: ...; }`.

3. **Motor vs PyMongo:** FastAPI backend uses Motor (async). Seed scripts (create_test_accounts.py, seed_properties.py) use PyMongo (sync, standalone scripts).

4. **Auth:** Firebase Auth (email/password) -> Firebase ID token -> FastAPI verifies via firebase-admin SDK. Token stored in localStorage as `token`.

5. **PropertyUpdate Model:** PUT endpoint uses PropertyUpdate Pydantic model - prevents overwriting seller_id, status, or view_count.

6. **CORS:** Never use allow_origins=["*"] with allow_credentials=True - browsers block this.

7. **Recommendation Engine:** 3-tier fallback: (a) location-based matching via browser Geolocation API + Nominatim reverse geocoding, (b) most-viewed ACTIVE listings, (c) newest listings by insertion order. Frontend passes district/city from geolocation to `GET /properties/recommendations`.

8. **Browse Page Architecture:** Static search header at top (not sticky), expandable filter panel, recommendations section (shown only when no active search/filter), then the main property grid.

### MongoDB Schema

**users:** _id (Firebase UID), email, phone_number (unique, 10 digits), role (BUYER/SELLER/ADMIN), full_name?, kyc_details?, wishlist[] (property IDs), created_at

**properties:** _id, seller_id, city, district, state, area, area_unit, price, type, keywords[], description?, documents[] ({type, url}), images[] (string paths), status (ACTIVE/PENDING_VERIFICATION/REJECTED), view_count, soil_type?, water_source?, road_access?, fencing?, electricity (bool), irrigation (bool), nearby_town?, distance_from_town_km?, created_at

**transactions:** _id, buyer_id, property_id, amount (500), status (SUCCESS), created_at
