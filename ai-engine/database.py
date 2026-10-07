import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env.local")

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/queueless")
# Extract DB name from URI or default to 'queueless'
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
