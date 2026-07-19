import sys
from pymongo import MongoClient

uri = "mongodb+srv://infernapeshashank_db_user:o34bc6Gtos0PsFzM@cluster0.yrjzo2q.mongodb.net/?appName=Cluster0"
try:
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    db = client["propit_test_db"]
    col = db["test_collection"]
    
    # Write test
    res = col.insert_one({"test": "hello world"})
    print(f"Write successful! Inserted ID: {res.inserted_id}")
    
    # Read test
    doc = col.find_one({"_id": res.inserted_id})
    print(f"Read successful! Found doc: {doc}")
    
    # Clean up
    col.delete_one({"_id": res.inserted_id})
    print("Cleanup successful.")
    
except Exception as e:
    print(f"Connection/Operation failed: {e}")
    sys.exit(1)
