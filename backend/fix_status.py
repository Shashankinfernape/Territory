from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
db = MongoClient(os.getenv('MONGODB_URL'))[os.getenv('DATABASE_NAME')]
result = db.properties.update_many({"status": "VERIFIED"}, {"$set": {"status": "ACTIVE"}})
print(f"Updated {result.modified_count} properties to ACTIVE.")
