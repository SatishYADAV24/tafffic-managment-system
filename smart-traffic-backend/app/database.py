import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "smart_traffic")

client = MongoClient(MONGO_URI)

db = client[DATABASE_NAME]

traffic_collection = db["traffic"]

print("DATABASE:", db.name)
print("COLLECTION:", traffic_collection.name)
print("ALL DATABASES:", client.list_database_names())


def test_database():
    try:
        client.admin.command("ping")
        print("MongoDB connected successfully!")
        return True
    except Exception as e:
        print("MongoDB connection failed:", e)
        return False