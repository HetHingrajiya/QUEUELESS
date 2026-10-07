from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import connect_to_mongo, close_mongo_connection, get_db
import os

app = FastAPI(
    title="QueueLess AI Engine",
    description="Machine Learning Microservice for Queue Prediction and Analytics",
    version="0.1.0"
)

# Configure CORS so Next.js app can communicate if needed directly,
# though ideally Next.js backend will proxy requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.get("/")
async def root():
    return {"message": "QueueLess AI Engine is running", "status": "online"}

@app.get("/health")
async def health_check():
    db = get_db()
    try:
        # Check database connection
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = "disconnected"
        
    return {
        "status": "ok",
        "database": db_status
    }

from routers import predict

app.include_router(predict.router, prefix="/api/predict", tags=["Prediction"])

if __name__ == "__main__":
    import uvicorn
    # When running directly for dev
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
