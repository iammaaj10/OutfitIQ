from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

client = MongoClient(os.getenv("MONGO_URL"))
db = client[os.getenv("DB_NAME")]

# Collections
users_collection = db["users"]
profiles_collection = db["profiles"]
inventory_collection = db["inventory"]