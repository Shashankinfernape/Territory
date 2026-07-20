# 09. Environment & Configuration

This document outlines the environment variables and configuration steps required to run the TERRITORY (PropIt) platform locally or in a production environment.

## 1. Backend Configuration (`backend/.env`)

The FastAPI backend requires the following environment variables to function correctly. A template is provided in `backend/.env.example`.

| Variable | Required | Default Value | Description |
|---|---|---|---|
| `MONGODB_URL` | Yes | `mongodb://localhost:27017` | The connection string for the main MongoDB instance (properties & transactions). |
| `DATABASE_NAME` | Yes | `propit` | The name of the main database. |
| `MONGODB_AUTH_URL` | No | Same as `MONGODB_URL` | The connection string for the auth MongoDB instance. Allows splitting auth data to a separate cluster. |
| `AUTH_DATABASE_NAME` | No | `propit_auth` | The name of the auth database (users & settings). |
| `ALLOWED_ORIGINS` | Yes | `http://localhost:5173` | A comma-separated list of exact origin URLs (no trailing slashes) permitted to make CORS requests. Wildcards (`*`) are strictly prohibited by the application logic due to credentials being passed. |
| `FIREBASE_SERVICE_ACCOUNT_PATH`| Yes | `firebase-service-account.json` | The relative or absolute path to the Firebase Admin SDK private key JSON file. Required for verifying JWT tokens. |

## 2. Frontend Configuration (`frontend/.env.local`)

The Vite-based frontend uses environment variables prefixed with `VITE_` to expose them to the client-side code.

| Variable | Required | Default Value | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `http://localhost:8000/api/v1` | The base URL for all Axios requests to the backend. In production, this should point to your deployed FastAPI domain. |

## 3. Firebase Configuration

To set up authentication, you must configure a Firebase project:

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable the **Google Authentication Provider** in the Authentication settings.
3. Add a "Web App" to the project to get your client-side Firebase config (`apiKey`, `authDomain`, `projectId`, etc.). 
   * *(Note: In the current codebase, this config must be added to the frontend Firebase initialization script).*
4. Navigate to Project Settings -> Service Accounts.
5. Generate a new private key.
6. Rename the downloaded JSON file to `firebase-service-account.json` and place it in the `/backend` directory.

## 4. Local Development Setup

### Backend Start
1. `cd backend`
2. Create and activate a Python virtual environment: `python -m venv venv` followed by `source venv/bin/activate` (or `.\venv\Scripts\activate` on Windows).
3. Install dependencies: `pip install -r requirements.txt`.
4. Run the seed scripts if you need mock data (ensure MongoDB is running locally):
   * `python create_test_accounts.py`
   * `python seed_properties.py`
5. Start the server: `uvicorn main:app --reload`.

### Frontend Start
1. `cd frontend`
2. Install Node dependencies: `npm install`.
3. Start the Vite dev server: `npm run dev`.

## 5. Production Deployment Notes

* **CORS**: Ensure `ALLOWED_ORIGINS` in the backend exactly matches the frontend's deployed domain (e.g., `https://territory.com`).
* **Static Files**: The backend currently serves files from a local `/uploads` directory using `StaticFiles`. For a multi-instance production deployment (e.g., serverless functions or container orchestration), local disk storage is ephemeral. The `/uploads` logic must be refactored to use a cloud blob storage service (like AWS S3) before scaling.
* **Process Manager**: Use Gunicorn with Uvicorn workers in production instead of plain `uvicorn` for better resilience and performance.
