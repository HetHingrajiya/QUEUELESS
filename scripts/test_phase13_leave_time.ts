import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { Token } from '@/models/Token';
import { calculateRealTravelTime } from '@/lib/geo/routing';
import { calculateDepartureAdvisory } from '@/lib/geo/departure';

async function runPhase13Audit() {
  console.log('==================================================');
  console.log('QUEUELESS PHASE 13: REAL WHEN-SHOULD-I-LEAVE AUDIT');
  console.log('==================================================');

  await dbConnect();
  console.log('Connected to MongoDB.');

  try {
    const office = await Office.findOne({ latitude: { $ne: null }, longitude: { $ne: null } }).lean();
    if (!office || !office.latitude || !office.longitude) {
      throw new Error('No office with valid coordinates found');
    }
    console.log(`Auditing Office: "${office.name}" at (${office.latitude}, ${office.longitude})`);

    // --- TEST 1: Real Routing Provider Execution ---
    console.log('\n--- TEST 1: Actual Routing Provider Query ---');
    // Nearby coordinates (~3 km from office)
    const citizenLat = office.latitude + 0.02;
    const citizenLon = office.longitude + 0.02;

    const routeResult = await calculateRealTravelTime(citizenLat, citizenLon, office.latitude, office.longitude);
    console.log('Route result:', routeResult);

    if (routeResult.available) {
      console.log(`✓ Real Road Travel Duration: ${routeResult.travelTimeMinutes} mins`);
      console.log(`✓ Real Distance: ${routeResult.distanceKm} km (Provider: ${routeResult.provider})`);
      if (typeof routeResult.travelTimeMinutes !== 'number' || routeResult.travelTimeMinutes <= 0) {
        throw new Error('Invalid travel time duration');
      }
    } else {
      console.log('Routing provider was unreachable or offline; verified available: false.');
    }

    // --- TEST 2: Formula Concept & Calculations ---
    console.log('\n--- TEST 2: Real Departure Formula Verification ---');
    const now = new Date('2026-10-09T10:00:00Z');
    const predictedWait = 45; // 45 mins wait
    const travelTime = 12;    // 12 mins travel
    const buffer = 5;         // 5 mins check-in buffer

    const advisory = calculateDepartureAdvisory(
      now,
      predictedWait,
      travelTime,
      4.2,
      'OSRM',
      buffer
    );

    console.log('Advisory with travel time:', advisory);
    // targetArrivalTime = 10:00 + (45 - 5) = 10:40
    // departureTime = 10:40 - 12 = 10:28 (in 28 mins)
    if (advisory.leaveInMinutes !== 28) {
      throw new Error(`Expected leaveInMinutes 28, got ${advisory.leaveInMinutes}`);
    }
    if (advisory.urgency !== 'RELAX') {
      throw new Error(`Expected urgency RELAX for 28 mins, got ${advisory.urgency}`);
    }
    console.log('✓ TEST 2 PASSED: Departure window correctly computed as predictedWait - buffer - travelTime.');

    // --- TEST 3: Immediate Departure When Wait <= Travel + Buffer ---
    console.log('\n--- TEST 3: Urgent / Immediate Departure Calculation ---');
    const urgentWait = 15;
    const urgentTravel = 12;
    const urgentBuffer = 5; // 12 + 5 = 17 > 15
    const urgentAdvisory = calculateDepartureAdvisory(
      now,
      urgentWait,
      urgentTravel,
      3.8,
      'OSRM',
      urgentBuffer
    );
    console.log('Urgent advisory:', urgentAdvisory);
    if (urgentAdvisory.urgency !== 'LEAVE_NOW' || urgentAdvisory.leaveInMinutes !== 0) {
      throw new Error(`Expected LEAVE_NOW and 0 mins, got ${urgentAdvisory.urgency} and ${urgentAdvisory.leaveInMinutes}`);
    }
    console.log('✓ TEST 3 PASSED: Correctly triggers immediate departure.');

    // --- TEST 4: Routing Provider Unavailable (Never Fake 15, 20, 30 mins) ---
    console.log('\n--- TEST 4: Unavailable Provider & No Fake Numbers ---');
    const unavailableAdvisory = calculateDepartureAdvisory(
      now,
      predictedWait,
      null, // travel time unavailable!
      null,
      null,
      buffer
    );

    console.log('Unavailable advisory:', unavailableAdvisory);
    if (unavailableAdvisory.travelTimeAvailable !== false) {
      throw new Error('travelTimeAvailable must be false');
    }
    if (unavailableAdvisory.travelTimeMinutes !== null) {
      throw new Error(`travelTimeMinutes must be null, found ${unavailableAdvisory.travelTimeMinutes}`);
    }
    if (unavailableAdvisory.recommendedDepartureTime !== null) {
      throw new Error(`recommendedDepartureTime must be null when travel unavailable, found ${unavailableAdvisory.recommendedDepartureTime}`);
    }
    // Verify banned fake values
    if ([15, 20, 30].includes(unavailableAdvisory.travelTimeMinutes as any)) {
      throw new Error('BANNED FAKE TRAVEL TIME DETECTED!');
    }
    // Verify separate queue prediction is still provided
    if (unavailableAdvisory.predictedWaitMinutes !== 45 || !unavailableAdvisory.targetArrivalTime) {
      throw new Error('Queue prediction missing when travel time is unavailable');
    }
    console.log('✓ TEST 4 PASSED: Gracefully reports "Travel time unavailable" with separate queue predictions and zero fake numbers.');

    console.log('\n==================================================');
    console.log('ALL PHASE 13 AUDIT CHECKS PASSED SUCCESSFULLY!');
    console.log('==================================================');
    process.exit(0);
  } catch (err) {
    console.error('Phase 13 audit failed:', err);
    process.exit(1);
  }
}

runPhase13Audit();
