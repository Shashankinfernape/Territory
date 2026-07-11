"""
create_test_accounts.py — Create test accounts in Firebase (via Client REST API) and MongoDB.
"""
import os
import json
import sys
import urllib.request
import urllib.error
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Firebase Client API Key (from frontend/.env.local)
API_KEY = "AIzaSyC5jkUhCa0nCbVDakA4vTB5epDh6oFwOms"
MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "propit")

def register_firebase_user(email, password):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            return res["localId"]
    except urllib.error.HTTPError as e:
        try:
            err_res = json.loads(e.read().decode("utf-8"))
            err_msg = err_res.get("error", {}).get("message", "")
            if err_msg == "EMAIL_EXISTS":
                # User already registered, sign in to retrieve their Firebase UID
                return sign_in_firebase_user(email, password)
            else:
                print(f"Firebase API Error for {email}: {err_msg}")
                return None
        except Exception:
            print(f"HTTP Error {e.code} for {email}")
            return None
    except Exception as e:
        print(f"Connection error for {email}: {e}")
        return None

def sign_in_firebase_user(email, password):
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            return res["localId"]
    except Exception as e:
        print(f"Sign-in failed for existing user {email}: {e}")
        return None

def main():
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]

    accounts = [
        {
            "email": "admin@propit.com",
            "password": "adminpassword",
            "phone": "9999999999",
            "name": "System Administrator",
            "role": "ADMIN"
        },
        {
            "email": "buyer@propit.com",
            "password": "buyerpassword",
            "phone": "8888888888",
            "name": "Test Buyer",
            "role": "BUYER"
        },
        {
            "email": "seller@propit.com",
            "password": "sellerpassword",
            "phone": "7777777777",
            "name": "Test Seller",
            "role": "SELLER"
        }
    ]

    print("\n--- Bootstrapping Test Accounts via Firebase Client API ---")
    for acc in accounts:
        uid = register_firebase_user(acc["email"], acc["password"])
        if not uid:
            print(f"Failed to create/resolve user UID for {acc['email']}. Skipping sync.")
            continue

        # Sync to MongoDB
        existing = db.users.find_one({"_id": uid})
        if existing:
            db.users.update_one(
                {"_id": uid},
                {"$set": {
                    "email": acc["email"],
                    "phone_number": acc["phone"],
                    "role": acc["role"],
                    "full_name": acc["name"]
                }}
            )
            print(f"Synced & updated user {acc['email']} (role: {acc['role']}) in MongoDB.")
        else:
            db.users.insert_one({
                "_id": uid,
                "email": acc["email"],
                "phone_number": acc["phone"],
                "role": acc["role"],
                "full_name": acc["name"],
                "created_at": datetime.utcnow()
            })
            print(f"Inserted new user {acc['email']} (role: {acc['role']}) in MongoDB.")

    print("\n--- Credentials Summary ---")
    for acc in accounts:
        print(f"Role: {acc['role'].ljust(8)} | Email: {acc['email'].ljust(20)} | Password: {acc['password']}")
    print("----------------------------\n")

    client.close()

if __name__ == "__main__":
    main()
