"""
create_admin.py — CLI script to bootstrap the initial ADMIN user in Firebase and MongoDB.
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth

load_dotenv()


def init_firebase():
    firebase_service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json")
    if os.path.exists(firebase_service_account_path):
        try:
            cred = credentials.Certificate(firebase_service_account_path)
            firebase_admin.initialize_app(cred)
        except ValueError:
            pass # Already initialized
    else:
        try:
            firebase_admin.initialize_app()
        except ValueError:
            pass # Already initialized
        except Exception as e:
            raise RuntimeError(
                f"Firebase Admin SDK could not be initialized. "
                f"Please place your Firebase service account JSON in the backend folder. Error: {e}"
            )


def create_admin() -> None:
    init_firebase()

    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "propit")
    phone_number = os.getenv("ADMIN_PHONE", "9999999999")
    password = os.getenv("ADMIN_PASSWORD", "adminpassword")
    email = os.getenv("ADMIN_EMAIL", "admin@propit.com")

    # Connect to MongoDB
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[db_name]

    # Check if admin user exists in Firebase Auth
    firebase_user = None
    uid = None
    try:
        firebase_user = auth.get_user_by_email(email)
        print(f"Admin already exists in Firebase Auth (UID: {firebase_user.uid}).")
        uid = firebase_user.uid
    except auth.UserNotFoundError:
        # Create user in Firebase Auth
        try:
            firebase_user = auth.create_user(
                email=email,
                password=password,
                phone_number=f"+91{phone_number}",  # Add India prefix for Firebase formatting
                display_name="System Administrator",
            )
            print(f"Admin user created in Firebase Auth (UID: {firebase_user.uid}).")
            uid = firebase_user.uid
        except Exception as e:
            # Try without phone number in case of formatting or duplicate phone issues
            try:
                firebase_user = auth.create_user(
                    email=email,
                    password=password,
                    display_name="System Administrator",
                )
                print(f"Admin user created in Firebase Auth without phone number (UID: {firebase_user.uid}).")
                uid = firebase_user.uid
            except Exception as ex:
                print(f"Error creating admin in Firebase Auth: {ex}")
                client.close()
                return
    except Exception as e:
        print(f"\n[Warning] Firebase Auth communication failed: {e}")
        print("Proceeding to sync default Admin account directly to MongoDB...")
        uid = "jX2SisGiSsf0O3LqCNwH1W6dGw52"

    if not uid:
        print("Failed to resolve or create Admin user UID.")
        client.close()
        return

    # Sync to MongoDB
    existing = db.users.find_one({"_id": uid})
    if existing:
        print(f"Admin user with UID {uid} already exists in MongoDB. No changes made.")
    else:
        admin_user = {
            "_id": uid,
            "email": email,
            "phone_number": phone_number,
            "role": "ADMIN",
            "full_name": "System Administrator",
        }
        db.users.insert_one(admin_user)
        print(f"Admin synced to MongoDB successfully under UID {uid}.")

    print(
        f"\nAdmin credentials summary:\n"
        f"  Email:    {email}\n"
        f"  Password: {password}\n"
        f"  Phone:    {phone_number}\n"
    )
    client.close()


if __name__ == "__main__":
    create_admin()
