import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv("MONGODB_URL"))
db_name = os.getenv("DATABASE_NAME")

print(f"Dropping database: {db_name}")
client.drop_database(db_name)
print("Database successfully dropped!")
