import unittest
import os
import sys
import json
import numpy as np
from bson import ObjectId

sys.path.append(os.path.dirname(__file__))
sys.path.append(os.path.join(os.path.dirname(__file__), "ml_models"))

from database import get_sync_db
import wait_time_model
from wait_time_model import (
    load_model,
    predict_wait_time_ml,
    MODEL_PATH,
    EVAL_PATH,
    MODEL_VERSION,
    extract_real_training_data
)

class TestQueueLessMLAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = get_sync_db()

    def test_01_model_file_exists_and_loads(self):
        """Verify trained Random Forest model file exists and loads properly."""
        self.assertTrue(os.path.exists(MODEL_PATH), f"Model file missing at {MODEL_PATH}")
        model = load_model()
        self.assertIsNotNone(model, "Failed to load model file")
        self.assertEqual(len(model.estimators_), 100, "Expected 100 estimators in Random Forest")
        self.assertEqual(model.n_features_in_, 10, "Expected 10 input features in Random Forest")

    def test_02_evaluation_report_and_baseline_comparison(self):
        """Verify evaluation report exists and ML model genuinely outperforms baseline."""
        self.assertTrue(os.path.exists(EVAL_PATH), f"Evaluation report missing at {EVAL_PATH}")
        with open(EVAL_PATH, "r") as f:
            eval_data = json.load(f)

        self.assertEqual(eval_data.get("status"), "TRAINED")
        self.assertGreater(eval_data.get("total_samples", 0), 50)
        self.assertGreater(eval_data.get("test_samples", 0), 10)

        base = eval_data.get("baseline_metrics", {})
        ml = eval_data.get("ml_metrics", {})

        print(f"\n[Audit Test] Baseline MAE: {base.get('mae')} | ML MAE: {ml.get('mae')}")
        print(f"[Audit Test] Baseline RMSE: {base.get('rmse')} | ML RMSE: {ml.get('rmse')}")
        print(f"[Audit Test] Baseline R2: {base.get('r2')} | ML R2: {ml.get('r2')}")

        # Confirm ML outperforms baseline on test split
        self.assertLess(ml.get("mae"), base.get("mae"), "ML MAE must outperform baseline MAE")
        self.assertLess(ml.get("rmse"), base.get("rmse"), "ML RMSE must outperform baseline RMSE")
        self.assertGreater(ml.get("r2"), base.get("r2"), "ML R2 must outperform baseline R2")

    def test_03_prediction_with_valid_operational_features(self):
        """Verify live prediction produces valid wait time and genuine confidence."""
        res = predict_wait_time_ml(
            queue_length=6,
            people_ahead=5,
            hour=10,
            day_of_week=2,
            priority="NORMAL",
            active_counters=2,
            service_duration=10.0
        )
        self.assertEqual(res["prediction_source"], "ML_MODEL")
        self.assertEqual(res["model_version"], MODEL_VERSION)
        self.assertGreaterEqual(res["estimated_wait_time_mins"], 1)
        self.assertIsNotNone(res["confidence_score"])
        self.assertGreaterEqual(res["confidence_score"], 0.15)
        self.assertLessEqual(res["confidence_score"], 0.95)

    def test_04_priority_and_peak_hour_sensitivity(self):
        """Verify that VIP priority reduces predicted wait time compared to NORMAL."""
        normal_res = predict_wait_time_ml(
            queue_length=8,
            people_ahead=7,
            hour=12,
            day_of_week=0,
            priority="NORMAL",
            active_counters=1,
            service_duration=10.0
        )
        vip_res = predict_wait_time_ml(
            queue_length=8,
            people_ahead=7,
            hour=12,
            day_of_week=0,
            priority="VIP",
            active_counters=1,
            service_duration=10.0
        )
        self.assertLess(
            vip_res["estimated_wait_time_mins"],
            normal_res["estimated_wait_time_mins"],
            "VIP priority must result in shorter wait time than normal priority"
        )

    def test_05_cold_start_and_missing_model_fallback(self):
        """Verify transparent statistical fallback when model is unloaded/missing."""
        orig_load = wait_time_model.load_model
        try:
            wait_time_model.load_model = lambda: None
            fallback_res = predict_wait_time_ml(
                queue_length=4,
                people_ahead=3,
                hour=14,
                day_of_week=1,
                priority="NORMAL",
                active_counters=1,
                service_duration=10.0
            )
            self.assertEqual(fallback_res["prediction_source"], "STATISTICAL_FALLBACK")
            self.assertIsNone(fallback_res["confidence_score"], "Fallback must not fabricate confidence")
            self.assertEqual(fallback_res["estimated_wait_time_mins"], 30) # (3 * 10) / 1
        finally:
            wait_time_model.load_model = orig_load

    def test_06_office_data_isolation(self):
        """Verify data isolation: counter differences between offices change predictions."""
        # Office A: 1 counter
        res_a = predict_wait_time_ml(
            queue_length=4,
            people_ahead=3,
            hour=10,
            day_of_week=1,
            priority="NORMAL",
            active_counters=1,
            service_duration=10.0
        )
        # Office B: 2 counters
        res_b = predict_wait_time_ml(
            queue_length=4,
            people_ahead=3,
            hour=10,
            day_of_week=1,
            priority="NORMAL",
            active_counters=2,
            service_duration=10.0
        )
        self.assertGreater(
            res_a["estimated_wait_time_mins"],
            res_b["estimated_wait_time_mins"],
            "Single counter office must have higher wait time than dual counter office"
        )

    def test_07_invalid_input_resilience(self):
        """Verify safe handling of zero/negative counters, negative people ahead."""
        res_zero_counters = predict_wait_time_ml(
            queue_length=0,
            people_ahead=-5,
            hour=25,
            day_of_week=9,
            priority="UNKNOWN",
            active_counters=0,
            service_duration=-10.0
        )
        self.assertGreaterEqual(res_zero_counters["estimated_wait_time_mins"], 1)

    def test_08_mongo_historical_dataset_integrity(self):
        """Verify historical dataset validity in MongoDB."""
        df = extract_real_training_data(self.db)
        self.assertGreaterEqual(len(df), 50, "Historical sample count must be at least 50")
        # Ensure target label quality
        self.assertTrue((df["actual_wait_time"] >= 0).all(), "Negative wait times must be purged")
        self.assertTrue((df["actual_wait_time"] <= 300).all(), "Extreme outliers must be capped")
        self.assertTrue((df["active_counters"] >= 1).all(), "Active counters must be at least 1")

if __name__ == "__main__":
    unittest.main()
