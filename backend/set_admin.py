"""
set_admin.py — Helper script to promote a registered user to ADMIN role in MongoDB.
Usage: python set_admin.py <email>
"""
import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def promote_to_admin():
    if len(sys.argv) < 2:
        print("Error: Please provide the email address of the user to promote.")
        print("Usage: python set_admin.py user@example.com")
        sys.exit(1)

    email = sys.argv[1].strip()
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "propit")

    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[db_name]

    # Find the user by email
    user = db.users.find_one({"email": email})
    if not user:
        print(f"Error: User with email '{email}' was not found in MongoDB.")
        print("Please register this email account first through the website sign-up form!")
        client.close()
        sys.exit(1)

    # Update role to ADMIN
    res = db.users.update_one({"_id": user["_id"]}, {"$set": {"role": "ADMIN"}})
    if res.modified_count > 0:
        print(f"Success! Promoted '{email}' to ADMIN in MongoDB.")
    else:
        if user.get("role") == "ADMIN":
            print(f"User '{email}' is already an ADMIN.")
        else:
            print(f"Failed to update role for '{email}'.")

    client.close()

if __name__ == "__main__":
    promote_to_admin()
