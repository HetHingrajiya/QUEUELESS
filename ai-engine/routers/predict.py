from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import json
import sys
import os

from database import get_db

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml_models"))
from wait_time_model import predict_wait_time_ml, EVAL_PATH

router = APIRouter()

class PredictionRequest(BaseModel):
    service_id: str
    office_id: str
    priority: str = "NORMAL"
    people_ahead: Optional[int] = None
    token_id: Optional[str] = None

class PredictionResponse(BaseModel):
    estimated_wait_time_mins: int
    confidence_score: Optional[float] = None
    queue_length: int
    people_ahead: int
    active_counters: int
    model_version: str
    prediction_source: str
    prediction_timestamp: str

@router.post("/wait-time", response_model=PredictionResponse)
async def predict_wait_time(request: PredictionRequest):
    """
    Predicts queue wait time scoped strictly by office and service.
    Guarantees data isolation: no cross-office queue leakage.
    Genuinely calculates confidence or leaves it None (no fake 0.92).
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")

    try:
        office_oid = ObjectId(request.office_id)
        service_oid = ObjectId(request.service_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid office_id or service_id format")

    # 1. Strictly scoped queue length (DATA ISOLATION)
    queue_filter = {
        "officeId": office_oid,
        "serviceId": service_oid,
        "status": {"$in": ["WAITING", "CHECKED_IN"]}
    }
    queue_count = await db.tokens.count_documents(queue_filter)

    # 2. People ahead in this scoped queue
    if request.people_ahead is not None and request.people_ahead >= 0:
        people_ahead = request.people_ahead
    else:
        people_ahead = max(0, queue_count - 1)

    # 3. Active counters scoped to this office
    counter_count = await db.counters.count_documents({
        "officeId": office_oid,
        "status": "ACTIVE",
        "isActive": True
    })
    active_counters = max(1, counter_count)

    # 4. Service average duration from DB
    service_doc = await db.services.find_one({"_id": service_oid})
    service_duration = float(service_doc.get("averageServiceTime", 10)) if service_doc else 10.0

    # 5. Temporal context
    now = datetime.now()
    hour = now.hour
    day_of_week = now.weekday()

    # 6. Generate Prediction
    res = predict_wait_time_ml(
        queue_length=queue_count,
        people_ahead=people_ahead,
        hour=hour,
        day_of_week=day_of_week,
        priority=request.priority,
        active_counters=active_counters,
        service_duration=service_duration
    )

    return PredictionResponse(
        estimated_wait_time_mins=res["estimated_wait_time_mins"],
        confidence_score=res["confidence_score"],
        queue_length=queue_count,
        people_ahead=people_ahead,
        active_counters=active_counters,
        model_version=res["model_version"],
        prediction_source=res["prediction_source"],
        prediction_timestamp=res["prediction_timestamp"]
    )

@router.get("/evaluation")
async def get_model_evaluation():
    """
    Returns stored model evaluation report comparing baseline vs ML model.
    Reports MAE, RMSE, and R2.
    """
    if os.path.exists(EVAL_PATH):
        try:
            with open(EVAL_PATH, "r") as f:
                return json.load(f)
        except Exception as e:
            return {"status": "ERROR", "message": str(e)}
    
    return {
        "status": "NOT_EVALUATED",
        "message": "Model evaluation not yet generated. Run training pipeline to produce evaluation report."
    }

from queue_analytics import get_queue_analytics
from database import get_sync_db

class AnalyticsRequest(BaseModel):
    office_id: str
    service_id: str
    priority: str = "NORMAL"
    people_ahead: Optional[int] = None
    travel_minutes: int = 15

@router.post("/analytics")
async def get_comprehensive_analytics(request: AnalyticsRequest):
    """
    Returns all 14 QueueLess AI Features backed by real MongoDB operational data.
    Strictly isolated by office_id and service_id.
    Includes full explainability, confidence (if genuine), sources, and fallbacks.
    """
    try:
        db = get_sync_db()
        return get_queue_analytics(
            db=db,
            office_id=request.office_id,
            service_id=request.service_id,
            priority=request.priority,
            people_ahead=request.people_ahead,
            travel_minutes=request.travel_minutes
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

@router.post("/leave-time")
async def predict_leave_time(request: AnalyticsRequest):
    """
    When Should I Leave?
    Calculates departure advisory window based on real wait time forecast and travel buffer.
    """
    try:
        db = get_sync_db()
        analytics = get_queue_analytics(
            db=db,
            office_id=request.office_id,
            service_id=request.service_id,
            priority=request.priority,
            people_ahead=request.people_ahead,
            travel_minutes=request.travel_minutes
        )
        return {
            "success": True,
            "data": analytics["when_should_i_leave"],
            "metadata": analytics["metadata"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Leave time error: {str(e)}")

@router.get("/best-time-to-visit")
async def get_best_time(office_id: str, service_id: str):
    """
    Returns historical optimal arrival window with lowest wait times for this service.
    """
    try:
        db = get_sync_db()
        analytics = get_queue_analytics(
            db=db,
            office_id=office_id,
            service_id=service_id
        )
        return {
            "success": True,
            "data": analytics["best_time_to_visit"],
            "metadata": analytics["metadata"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Best time error: {str(e)}")
