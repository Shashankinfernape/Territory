import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def mock_photos():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.propit
    
    users = await db.users.find({"photo_url": {"$exists": False}}).to_list(None)
    updated = 0
    
    # Just a nice generic placeholder avatar
    default_avatar = "https://ui-avatars.com/api/?name=User&background=random&color=fff&size=200"
    
    for u in users:
        uid = str(u["_id"])
        
        # We can use their name for the placeholder if available
        name = u.get("full_name") or u.get("email") or "User"
        encoded_name = name.replace(" ", "+")
        avatar = f"https://ui-avatars.com/api/?name={encoded_name}&background=random&color=fff&size=200"
        
        await db.users.update_one({"_id": uid}, {"$set": {"photo_url": avatar}})
        print(f"Updated photo for {u.get('email', uid)}")
        updated += 1
            
    print(f"Finished updating {updated} users with mock avatars.")

if __name__ == "__main__":
    asyncio.run(mock_photos())
