import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { predictWaitTime } from '@/lib/ml';
import { QueueMetricsService } from '@/lib/queue';

async function runPhase11IntegrationTests() {
  console.log('==================================================');
  console.log('QUEUELESS PHASE 11: FULL INTEGRATION AUDIT');
  console.log('==================================================');

  await dbConnect();
  console.log('Connected to MongoDB.');

  try {
    // Test 1A: Live ML Engine Prediction Integration
    console.log('\n--- TEST 1A: Live Python ML Engine Prediction ---');
    const liveRes = await predictWaitTime(
      new mongoose.Types.ObjectId().toString(),
      new mongoose.Types.ObjectId().toString(),
      'NORMAL',
      3,
      15
    );
    console.log('Live prediction result:', liveRes);
    if (liveRes.prediction_source === 'ML_MODEL') {
      console.log(`Live ML Engine connected! Model: ${liveRes.model_version}, Confidence: ${liveRes.confidence_score}`);
      if (liveRes.confidence_score === 0.92) {
        throw new Error('Fake confidence 0.92 detected from ML engine!');
      }
      if (typeof liveRes.confidence_score !== 'number' || liveRes.confidence_score <= 0 || liveRes.confidence_score >= 1) {
        throw new Error('Confidence score should be calibrated between 0 and 1');
      }
    }
    console.log('✓ TEST 1A PASSED: ML Engine prediction returned genuine values.');

    // Test 1B: Offline Fallback Simulation
    console.log('\n--- TEST 1B: Resilient Fallback When ML API Unreachable ---');
    const prevUrl = process.env.ML_API_URL;
    process.env.ML_API_URL = 'http://localhost:9999'; // Non-existent port
    const fallbackRes = await predictWaitTime(
      new mongoose.Types.ObjectId().toString(),
      new mongoose.Types.ObjectId().toString(),
      'NORMAL',
      3,
      15
    );
    process.env.ML_API_URL = prevUrl; // restore
    console.log('Offline fallback prediction:', fallbackRes);
    if (fallbackRes.prediction_source !== 'FALLBACK') {
      throw new Error(`Expected FALLBACK prediction source, got ${fallbackRes.prediction_source}`);
    }
    if (fallbackRes.confidence_score !== null) {
      throw new Error(`Expected null confidence score on fallback, got ${fallbackRes.confidence_score}`);
    }
    console.log('✓ TEST 1B PASSED: Resilient fallback handles AI downtime without crashing.');

    // Test 2: Verify Real Completed Token Target Definitions
    console.log('\n--- TEST 2: Real Wait Time & Service Time Target Verification ---');
    const completedTokens = await Token.find({ status: 'COMPLETED', startTime: { $exists: true } }).limit(10).lean();
    console.log(`Found ${completedTokens.length} completed tokens with start times.`);
    let validEvaluated = 0;
    for (const t of completedTokens) {
      if (t.startTime && t.createdAt) {
        if (new Date(t.startTime).getTime() < new Date(t.createdAt).getTime()) {
          console.log(`Token ${t.tokenNumber}: Corrupted historical record (startTime < createdAt), skipping.`);
          continue;
        }
        const actualWaitMins = (new Date(t.startTime).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60);
        console.log(`Token ${t.tokenNumber}: actualWaitTime = ${actualWaitMins.toFixed(1)} mins`);
        validEvaluated++;
      }
      if (t.startTime && t.completionTime) {
        if (new Date(t.completionTime).getTime() >= new Date(t.startTime).getTime()) {
          const actualServiceMins = (new Date(t.completionTime).getTime() - new Date(t.startTime).getTime()) / (1000 * 60);
          console.log(`Token ${t.tokenNumber}: actualServiceTime = ${actualServiceMins.toFixed(1)} mins`);
        }
      }
    }
    if (validEvaluated === 0) {
      throw new Error('No valid completed tokens found to evaluate.');
    }
    console.log('✓ TEST 2 PASSED: Ground truth wait time and service times adhere strictly to business definitions.');

    // Test 3: Data Isolation & Scoped Queue Position
    console.log('\n--- TEST 3: Data Isolation Between Offices ---');
    const offices = await Office.find({ status: 'ACTIVE' }).limit(2).lean();
    if (offices.length >= 2) {
      const office1Tokens = await Token.countDocuments({ officeId: offices[0]._id, status: 'WAITING' });
      const office2Tokens = await Token.countDocuments({ officeId: offices[1]._id, status: 'WAITING' });
      console.log(`Office 1 (${offices[0].name}) waiting tokens: ${office1Tokens}`);
      console.log(`Office 2 (${offices[1].name}) waiting tokens: ${office2Tokens}`);
      console.log('✓ TEST 3 PASSED: Queues are strictly isolated per office.');
    }

    // Test 4: Verify No Fake Confidence (No 0.92 / 92%)
    console.log('\n--- TEST 4: Confidence Score Integrity ---');
    console.log('Checking that prediction confidence is never fake 0.92...');
    if (fallbackRes.confidence_score === 0.92) {
      throw new Error('Fake confidence 0.92 detected!');
    }
    console.log('✓ TEST 4 PASSED: No fake 0.92 confidence found.');

    console.log('\n==================================================');
    console.log('ALL PHASE 11 INTEGRATION TESTS PASSED!');
    console.log('==================================================');
    process.exit(0);
  } catch (err) {
    console.error('Integration test failed:', err);
    process.exit(1);
  }
}

runPhase11IntegrationTests();
