import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ai-engine"))
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ai-engine", "ml_models"))

from database import get_sync_db
from queue_analytics import get_queue_analytics

def main():
    print("==================================================")
    print("PHASE 12 PYTHON AI ENGINE DIRECT TEST")
    print("==================================================")
    db = get_sync_db()
    office = db.offices.find_one({"status": "ACTIVE"})
    service = db.services.find_one({"officeId": office["_id"], "status": "ACTIVE"})
    print(f"Testing Office: {office['name']}, Service: {service['name']}")

    res = get_queue_analytics(
        db=db,
        office_id=str(office["_id"]),
        service_id=str(service["_id"]),
        priority="NORMAL",
        people_ahead=2,
        travel_minutes=15
    )

    print("\nVerified Capabilities:")
    print("1. Wait Time:", res["wait_time_prediction"]["estimated_wait_time_mins"], "mins, Source:", res["wait_time_prediction"]["prediction_source"], "Confidence:", res["wait_time_prediction"]["confidence_score"])
    print("2. Service Time:", res["service_time_prediction"]["predicted_service_time_mins"], "mins, Samples:", res["service_time_prediction"]["samples_evaluated"])
    print("3. Crowd Level:", res["crowd_prediction"]["crowd_level"], "| Hourly trend slots:", len(res["crowd_prediction"]["hourly_trends"]))
    print("4. Queue Load:", res["queue_load_forecast"]["level"], f"({res['queue_load_forecast']['load_percentage']}%)")
    print("5. Best Time:", res["best_time_to_visit"]["best_window"])
    print("6. When Should I Leave:", res["when_should_i_leave"]["recommended_departure_time"], "| Advice:", res["when_should_i_leave"]["advice"])
    print("7. Queue Health:", res["queue_health"]["status"], f"({res['queue_health']['score']}/100)")
    print("8. Bottleneck:", res["bottleneck_detection"]["summary"])
    print("9. Counter Load:", res["counter_load_prediction"]["tokens_per_counter"], "tokens/counter")
    print("10. Staff Capacity:", "Accommodate queue:", res["staff_capacity_forecast"]["can_accommodate_current_queue"])
    print("11. No-Show Risk:", res["no_show_risk"]["level"], "| Safeguard:", res["no_show_risk"]["safeguard_notice"])
    print("12. Queue Abandonment Risk:", res["queue_abandonment_risk"]["level"])
    print("13. Anomaly Detection:", res["anomaly_detection"]["is_anomaly"])
    print("14. AI Insights:", len(res["ai_insights"]), "explainable insights generated.")

    assert res["wait_time_prediction"]["prediction_source"] == "ML_MODEL"
    assert res["wait_time_prediction"]["confidence_score"] is not None
    assert res["wait_time_prediction"]["confidence_score"] != 0.92, "Must not be fake 0.92"
    assert "never uses no-show risk to reduce priority" in res["no_show_risk"]["safeguard_notice"]
    print("\nALL PHASE 12 PYTHON AI ENGINE CHECKS PASSED!")

if __name__ == "__main__":
    main()
