/**
 * Real When-Should-I-Leave Departure Advisory Engine
 * 
 * Formula:
 * 1. expectedCallTime = currentTime + predictedWaitMinutes
 * 2. targetArrivalTime = expectedCallTime - checkInBufferMinutes
 * 3. recommendedDeparture = targetArrivalTime - travelTimeMinutes
 * 
 * If routing/travel-time provider is unavailable:
 * - Do NOT invent travel time (never fake 15, 20, or 30 mins).
 * - Show: "Travel time unavailable"
 * - Still show queue prediction separately.
 */

export interface DepartureAdvisory {
  travelTimeAvailable: boolean;
  travelTimeMinutes: number | null;
  distanceKm: number | null;
  routingProvider: string | null;
  predictedWaitMinutes: number;
  checkInBufferMinutes: number;
  currentTime: string;
  expectedCallTime: string;
  targetArrivalTime: string;
  targetArrivalMinutesFromNow: number;
  recommendedDepartureTime: string | null;
  leaveInMinutes: number | null;
  urgency: 'LEAVE_NOW' | 'PREPARE' | 'RELAX' | 'UNAVAILABLE';
  advice: string;
  officeRuleNotice: string | null;
}

export function calculateDepartureAdvisory(
  currentTime: Date,
  predictedWaitMinutes: number,
  travelTimeMinutes: number | null,
  distanceKm: number | null,
  routingProvider: string | null,
  checkInBufferMinutes: number = 5,
  officeRules?: {
    isOpen?: boolean;
    closingTime?: string;
    openingTime?: string;
  }
): DepartureAdvisory {
  const safeWait = Math.max(0, Math.round(predictedWaitMinutes));
  const safeBuffer = Math.max(0, Math.round(checkInBufferMinutes));

  // 1. Expected Call Time
  const expectedCallDate = new Date(currentTime.getTime() + safeWait * 60000);
  const expectedCallTimeStr = expectedCallDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 2. Target Arrival Time at Office (arrive buffer minutes before call)
  const targetArrivalMinsFromNow = Math.max(0, safeWait - safeBuffer);
  const targetArrivalDate = new Date(currentTime.getTime() + targetArrivalMinsFromNow * 60000);
  const targetArrivalTimeStr = targetArrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Office Rules Notice
  let officeRuleNotice: string | null = null;
  if (officeRules?.isOpen === false) {
    officeRuleNotice = 'Office is currently closed according to published working hours.';
  } else if (officeRules?.closingTime) {
    officeRuleNotice = `Office closes at ${officeRules.closingTime}.`;
  }

  // 3. Travel Time Available branch
  if (travelTimeMinutes !== null && typeof travelTimeMinutes === 'number' && travelTimeMinutes > 0) {
    const safeTravel = Math.round(travelTimeMinutes);
    // minutes until citizen should depart from their location:
    // predictedWait - travelTime - checkInBuffer
    const departureDeltaMinutes = safeWait - safeTravel - safeBuffer;

    let urgency: 'LEAVE_NOW' | 'PREPARE' | 'RELAX';
    let leaveInMinutes: number;
    let departureDate: Date;
    let advice: string;

    if (departureDeltaMinutes <= 0) {
      urgency = 'LEAVE_NOW';
      leaveInMinutes = 0;
      departureDate = currentTime;
      advice = `Leave immediately! Your estimated wait is ${safeWait} mins, road transit is ~${safeTravel} mins, with a ${safeBuffer} min check-in buffer.`;
    } else if (departureDeltaMinutes <= 10) {
      urgency = 'PREPARE';
      leaveInMinutes = departureDeltaMinutes;
      departureDate = new Date(currentTime.getTime() + departureDeltaMinutes * 60000);
      advice = `Prepare to leave in ${leaveInMinutes} mins to arrive comfortably at ${targetArrivalTimeStr}.`;
    } else {
      urgency = 'RELAX';
      leaveInMinutes = departureDeltaMinutes;
      departureDate = new Date(currentTime.getTime() + departureDeltaMinutes * 60000);
      advice = `You have time to relax. Recommended departure is in ${leaveInMinutes} mins (at ${departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}).`;
    }

    return {
      travelTimeAvailable: true,
      travelTimeMinutes: safeTravel,
      distanceKm: distanceKm,
      routingProvider: routingProvider || 'OSRM',
      predictedWaitMinutes: safeWait,
      checkInBufferMinutes: safeBuffer,
      currentTime: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      expectedCallTime: expectedCallTimeStr,
      targetArrivalTime: targetArrivalTimeStr,
      targetArrivalMinutesFromNow: targetArrivalMinsFromNow,
      recommendedDepartureTime: departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leaveInMinutes: leaveInMinutes,
      urgency: urgency,
      advice: advice,
      officeRuleNotice: officeRuleNotice
    };
  }

  // 4. Travel Time Unavailable branch (NEVER invent fake 15/20/30 minutes)
  return {
    travelTimeAvailable: false,
    travelTimeMinutes: null,
    distanceKm: null,
    routingProvider: null,
    predictedWaitMinutes: safeWait,
    checkInBufferMinutes: safeBuffer,
    currentTime: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    expectedCallTime: expectedCallTimeStr,
    targetArrivalTime: targetArrivalTimeStr,
    targetArrivalMinutesFromNow: targetArrivalMinsFromNow,
    recommendedDepartureTime: null,
    leaveInMinutes: null,
    urgency: 'UNAVAILABLE',
    advice: `Travel time unavailable. Please plan to arrive at the office by ${targetArrivalTimeStr} (${targetArrivalMinsFromNow} mins from now) to check in before your turn.`,
    officeRuleNotice: officeRuleNotice
  };
}
