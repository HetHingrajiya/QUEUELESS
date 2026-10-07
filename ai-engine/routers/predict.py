from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db
from datetime import datetime
import sys
import os

# Add ml_models to path so we can import
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml_models"))
from wait_time_model import predict

router = APIRouter()

class PredictionRequest(BaseModel):
    service_id: str
    office_id: str
    priority: str = "NORMAL"

class PredictionResponse(BaseModel):
    estimated_wait_time_mins: int
    confidence_score: float
    queue_length: int

@router.post("/wait-time", response_model=PredictionResponse)
async def predict_wait_time(request: PredictionRequest):
    """
    Predict the estimated wait time using the Random Forest ML Model.
    """
    db = get_db()
    
    # 1. Fetch current queue length for this office & service
    queue_count = await db.tokens.count_documents({
        "status": {"$in": ["WAITING", "CHECKED_IN"]}
    })
    
    # 2. Get current hour of the day
    current_hour = datetime.now().hour
    
    # 3. Ask ML Model for prediction
    predicted_wait = predict(queue_length=queue_count, priority=request.priority, hour=current_hour)
    
    # Ensure it's non-negative
    est_wait = max(0, int(predicted_wait))
    
    return PredictionResponse(
        estimated_wait_time_mins=est_wait,
        confidence_score=0.92, # Placeholder for confidence interval
        queue_length=queue_count
    )
