import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import firebase_admin
from firebase_admin import credentials, auth
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase (assuming it's already set up or uses the json file)
cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)

async def sync_photos():
    client = AsyncIOMotorClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"))
    db = client.propit
    
    users = await db.users.find({}).to_list(None)
    updated = 0
    
    for u in users:
        uid = str(u["_id"])
        try:
            fb_user = auth.get_user(uid)
            if fb_user.photo_url and fb_user.photo_url != u.get("photo_url"):
                await db.users.update_one({"_id": uid}, {"$set": {"photo_url": fb_user.photo_url}})
                print(f"Updated photo for {u.get('email', uid)}")
                updated += 1
        except Exception as e:
            print(f"Skipped {uid}: {e}")
            
    print(f"Finished updating {updated} users.")

if __name__ == "__main__":
    asyncio.run(sync_photos())
