/**
 * Real Routing & Travel-Time Provider Service
 * 
 * Interacts with actual routing engines (OSRM / configurable routing API)
 * to retrieve real road network distances and travel durations.
 * 
 * CRITICAL RULE:
 * If routing provider is unavailable or coordinates are missing,
 * NEVER fake 15 minutes, 20 minutes, or 30 minutes.
 * Transparently return available: false.
 */

export interface RouteResult {
  available: boolean;
  travelTimeMinutes: number | null;
  distanceKm: number | null;
  provider: string | null;
  error?: string;
}

export async function calculateRealTravelTime(
  originLat?: number | null,
  originLon?: number | null,
  destLat?: number | null,
  destLon?: number | null
): Promise<RouteResult> {
  // 1. Validate coordinates
  if (
    originLat === null || originLat === undefined || isNaN(Number(originLat)) ||
    originLon === null || originLon === undefined || isNaN(Number(originLon)) ||
    destLat === null || destLat === undefined || isNaN(Number(destLat)) ||
    destLon === null || destLon === undefined || isNaN(Number(destLon))
  ) {
    return {
      available: false,
      travelTimeMinutes: null,
      distanceKm: null,
      provider: null,
      error: 'Coordinates missing or invalid'
    };
  }

  const oLat = Number(originLat);
  const oLon = Number(originLon);
  const dLat = Number(destLat);
  const dLon = Number(destLon);

  // Validate geographical bounds
  if (oLat < -90 || oLat > 90 || dLat < -90 || dLat > 90 || oLon < -180 || oLon > 180 || dLon < -180 || dLon > 180) {
    return {
      available: false,
      travelTimeMinutes: null,
      distanceKm: null,
      provider: null,
      error: 'Coordinates out of bounds'
    };
  }

  // 2. Query Routing Provider
  const routingUrl = process.env.ROUTING_API_URL || process.env.OSRM_API_URL || 'https://router.project-osrm.org';
  const endpoint = `${routingUrl}/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=false`;

  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(3000), // Strict 3s timeout
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'QueueLess-Mobility-Engine/1.0'
      }
    });

    if (!response.ok) {
      return {
        available: false,
        travelTimeMinutes: null,
        distanceKm: null,
        provider: null,
        error: `Routing provider returned status ${response.status}`
      };
    }

    const data = await response.json();

    if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
      const route = data.routes[0];
      const durationSeconds = route.duration; // in seconds
      const distanceMeters = route.distance;  // in meters

      if (typeof durationSeconds === 'number' && typeof distanceMeters === 'number') {
        const travelMinutes = Math.max(1, Math.round(durationSeconds / 60));
        const distanceKm = parseFloat((distanceMeters / 1000).toFixed(1));

        return {
          available: true,
          travelTimeMinutes: travelMinutes,
          distanceKm: distanceKm,
          provider: 'OSRM'
        };
      }
    }

    return {
      available: false,
      travelTimeMinutes: null,
      distanceKm: null,
      provider: null,
      error: 'Routing provider returned no routes'
    };

  } catch (error: any) {
    // Graceful degradation: never crash, never fake minutes
    return {
      available: false,
      travelTimeMinutes: null,
      distanceKm: null,
      provider: null,
      error: error?.message || 'Routing provider unavailable'
    };
  }
}
