import os
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
from dotenv import load_dotenv

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/queueless")
DB_NAME = MONGO_URI.split("/")[-1].split("?")[0] if "/" in MONGO_URI else "queueless"

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_config = Database()

async def connect_to_mongo():
    print(f"Connecting to MongoDB...")
    db_config.client = AsyncIOMotorClient(MONGO_URI)
    db_config.db = db_config.client[DB_NAME]
    print(f"Connected to database: {DB_NAME}")

async def close_mongo_connection():
    if db_config.client:
        db_config.client.close()
        print("MongoDB connection closed")

def get_db():
    return db_config.db

def get_sync_db():
    sync_client = pymongo.MongoClient(MONGO_URI)
    return sync_client[DB_NAME]
