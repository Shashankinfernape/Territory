"""
create_admin.py — One-time script to bootstrap the initial ADMIN user.

Credentials are read from environment variables (or a .env file) rather than
being hardcoded in source.  Required env vars:

    ADMIN_PHONE     — 10-digit phone number for the admin account
    ADMIN_PASSWORD  — password for the admin account

Optional env vars (inherited from the main app config):

    MONGODB_URL     — defaults to mongodb://localhost:27017
    DATABASE_NAME   — defaults to propit

Usage:
    python create_admin.py

This script intentionally uses a *synchronous* PyMongo connection (not Motor)
because it runs outside the FastAPI async event-loop context.  Using Motor
here would require wrapping everything in asyncio.run(), which works but adds
unnecessary complexity for a simple one-shot CLI script.
"""
import os
import bcrypt
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()




def create_admin() -> None:
    """Create the initial admin user using a synchronous MongoDB connection."""
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "propit")
    phone_number = os.getenv("ADMIN_PHONE", "9999999999")
    password = os.getenv("ADMIN_PASSWORD", "adminpassword")

    if phone_number == "9999999999" or password == "adminpassword":
        print(
            "WARNING: You are using default admin credentials.\n"
            "Set ADMIN_PHONE and ADMIN_PASSWORD environment variables before running in production!"
        )

    # Synchronous client — correct for a standalone CLI script.
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[db_name]

    existing = db.users.find_one({"phone_number": phone_number})
    if existing:
        print(f"Admin user with phone {phone_number} already exists. No changes made.")
        client.close()
        return

    admin_user = {
        "phone_number": phone_number,
        "password_hash": bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
        "role": "ADMIN",
        "full_name": "System Administrator",
    }

    db.users.insert_one(admin_user)
    print(
        f"Admin created successfully!\n"
        f"  Phone:    {phone_number}\n"
        f"  Password: {password}\n"
        "IMPORTANT: Change these credentials immediately in production!"
    )
    client.close()


if __name__ == "__main__":
    create_admin()
