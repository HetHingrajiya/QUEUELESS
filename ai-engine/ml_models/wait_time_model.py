import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "wait_time_rf.pkl")

def train_dummy_model():
    """
    Trains a basic Random Forest Regressor on dummy historical queue data
    so we have a real ML model file for Phase 5.
    """
    print("Generating dummy historical data for training...")
    
    # Features:
    # 1. queue_length: Number of people waiting
    # 2. priority_level: 0 for Normal, 1 for High
    # 3. hour_of_day: 9 to 17 (Peak hours usually 10-12, 14-16)
    
    np.random.seed(42)
    n_samples = 1000
    
    queue_lengths = np.random.randint(0, 50, n_samples)
    priorities = np.random.choice([0, 1], n_samples, p=[0.8, 0.2])
    hours = np.random.randint(9, 18, n_samples)
    
    # Target variable: Actual wait time in minutes
    # Base calculation: ~8 mins per person in queue
    base_wait = queue_lengths * 8
    
    # Priority adjustment: High priority skips half the line practically
    priority_adjustment = np.where(priorities == 1, 0.5, 1.0)
    
    # Peak hour penalty (11 AM and 3 PM are busiest)
    peak_penalty = np.where((hours == 11) | (hours == 15), 1.3, 1.0)
    
    # Add some random noise to simulate real world
    noise = np.random.normal(0, 5, n_samples)
    
    # Calculate final actual wait times
    actual_wait_times = (base_wait * priority_adjustment * peak_penalty) + noise
    actual_wait_times = np.maximum(actual_wait_times, 2) # minimum wait is 2 mins
    
    df = pd.DataFrame({
        'queue_length': queue_lengths,
        'priority': priorities,
        'hour': hours,
        'actual_wait_time': actual_wait_times
    })
    
    X = df[['queue_length', 'priority', 'hour']]
    y = df['actual_wait_time']
    
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)
    
    # Save the model
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

def load_model():
    """Loads the trained model, or trains it if not found."""
    if not os.path.exists(MODEL_PATH):
        train_dummy_model()
    return joblib.load(MODEL_PATH)

def predict(queue_length: int, priority: str, hour: int) -> float:
    model = load_model()
    
    # Encode priority
    priority_encoded = 1 if priority.upper() == "HIGH" else 0
    
    # Predict
    prediction = model.predict([[queue_length, priority_encoded, hour]])
    return prediction[0]

if __name__ == "__main__":
    # If run directly, generate the model
    train_dummy_model()
