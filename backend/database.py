import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "propit")

MONGODB_AUTH_URL = os.getenv("MONGODB_AUTH_URL", MONGODB_URL)
AUTH_DATABASE_NAME = os.getenv("AUTH_DATABASE_NAME", "propit_auth")

# Connection pooling is configured here. serverSelectionTimeoutMS prevents
# the app from hanging indefinitely if MongoDB is unreachable at startup.
client = AsyncIOMotorClient(
    MONGODB_URL,
    maxPoolSize=10,
    minPoolSize=1,
    serverSelectionTimeoutMS=5000,
)
db = client[DATABASE_NAME]

auth_client = AsyncIOMotorClient(
    MONGODB_AUTH_URL,
    maxPoolSize=10,
    minPoolSize=1,
    serverSelectionTimeoutMS=5000,
)
auth_db = auth_client[AUTH_DATABASE_NAME]


def get_db():
    return db

def get_auth_db():
    return auth_db


# Initialize Firebase Admin SDK
firebase_service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json")
if os.path.exists(firebase_service_account_path):
    try:
        cred = credentials.Certificate(firebase_service_account_path)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK successfully initialized using service account JSON.")
    except Exception as e:
        print(f"Error initializing Firebase Admin SDK with service account: {e}")
else:
    try:
        firebase_admin.initialize_app()
        print("Firebase Admin SDK initialized with default credentials.")
    except Exception as e:
        print(f"Warning: Firebase Admin SDK could not be initialized automatically. Please place '{firebase_service_account_path}' in the backend folder. Error: {e}")
