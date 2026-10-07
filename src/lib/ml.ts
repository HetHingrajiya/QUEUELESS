import { SystemSettings } from '@/models/SystemSettings';

export interface WaitTimePrediction {
  estimated_wait_time_mins: number;
  confidence_score: number;
  queue_length: number;
  factors?: any;
  prediction_source?: string;
}

/**
 * Calls the Python ML Engine to predict wait time.
 * If the ML engine is unreachable, falls back to a simple heuristic.
 */
export async function predictWaitTime(
  serviceId: string, 
  officeId: string, 
  priority: string = "NORMAL"
): Promise<WaitTimePrediction> {
  const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${ML_API_URL}/api/predict/wait-time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        office_id: officeId,
        priority: priority
      }),
      // Short timeout so we don't block the Node thread if Python API is down
      signal: AbortSignal.timeout(3000) 
    });

    if (!response.ok) {
      throw new Error(`ML Engine returned status ${response.status}`);
    }

    const data: WaitTimePrediction = await response.json();
    data.prediction_source = 'ML_MODEL';
    return data;
    
  } catch (error) {
    console.warn("ML Engine unavailable, using heuristic fallback:", error);
    
    // Fallback heuristic if Python backend is offline
    return {
      estimated_wait_time_mins: 15,
      confidence_score: 0, // NO FAKE CONFIDENCE
      queue_length: -1,
      prediction_source: 'FALLBACK'
    };
  }
}
