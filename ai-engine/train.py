import os
import sys

# Ensure ml_models is importable
sys.path.append(os.path.join(os.path.dirname(__file__), "ml_models"))
from wait_time_model import train_and_evaluate_model
from database import get_sync_db

def main():
    print("==================================================")
    print("QUEUELESS AI ENGINE — OPERATIONAL TRAINING RUN")
    print("==================================================")
    
    db = get_sync_db()
    result = train_and_evaluate_model(db)
    
    print("\nTraining & Evaluation Summary:")
    print(f"Status: {result.get('status')}")
    print(f"Model Version: {result.get('model_version')}")
    print(f"Total Samples: {result.get('total_samples')}")
    
    if result.get("status") == "TRAINED":
        base = result.get("baseline_metrics", {})
        ml = result.get("ml_metrics", {})
        print("\n--- MODEL COMPARISON ---")
        print(f"Baseline (Heuristic) -> MAE: {base.get('mae')} min | RMSE: {base.get('rmse')} min | R2: {base.get('r2')}")
        print(f"ML Model (RandomForest) -> MAE: {ml.get('mae')} min | RMSE: {ml.get('rmse')} min | R2: {ml.get('r2')}")
        print("\n--- FEATURE IMPORTANCES ---")
        for feat, imp in result.get("feature_importances", {}).items():
            print(f"  {feat}: {imp:.4f}")
    else:
        print(f"Message: {result.get('message')}")
        
    print("\nDone.")

if __name__ == "__main__":
    main()
