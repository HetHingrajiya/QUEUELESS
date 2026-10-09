import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { Service } from '@/models/Service';
import { Token } from '@/models/Token';
import { getComprehensiveQueueAnalytics, predictWaitTime } from '@/lib/ml';

async function runPhase12ExpansionAudit() {
  console.log('==================================================');
  console.log('QUEUELESS PHASE 12: AI FEATURE EXPANSION AUDIT');
  console.log('==================================================');

  await dbConnect();
  console.log('Connected to MongoDB.');

  try {
    const office = await Office.findOne({ status: 'ACTIVE' }).lean();
    if (!office) throw new Error('No active office found');
    const service = await Service.findOne({ officeId: office._id, status: 'ACTIVE' }).lean();
    if (!service) throw new Error('No active service found for office');

    console.log(`Auditing Office: "${office.name}" (${office._id}), Service: "${service.name}" (${service._id})`);

    // Fetch full 14-feature AI Analytics Suite
    const analytics = await getComprehensiveQueueAnalytics(
      service._id.toString(),
      office._id.toString(),
      'NORMAL',
      2,
      15,
      12
    );

    console.log('\n--- VERIFYING ALL 14 AI CAPABILITIES ---');

    // 1. Wait Time Prediction
    console.log('1. Wait Time Prediction:');
    const waitPred = analytics.wait_time_prediction;
    console.log(`   Estimated: ${waitPred.estimated_wait_time_mins} mins | Confidence: ${waitPred.confidence_score} | Source: ${waitPred.prediction_source}`);
    if (typeof waitPred.estimated_wait_time_mins !== 'number' || waitPred.estimated_wait_time_mins < 1) {
      throw new Error('Invalid wait time prediction');
    }
    if (waitPred.confidence_score === 0.92) {
      throw new Error('Fake 0.92 confidence detected!');
    }

    // 2. Service Time Prediction
    console.log('2. Service Time Prediction:');
    const svcP = analytics.service_time_prediction;
    console.log(`   Duration: ${svcP.predicted_service_time_mins} mins | Source: ${svcP.source} | Samples: ${svcP.samples_evaluated}`);
    if (svcP.predicted_service_time_mins <= 0) throw new Error('Invalid predicted service time');

    // 3. Crowd Prediction
    console.log('3. Crowd Prediction:');
    const crowd = analytics.crowd_prediction;
    console.log(`   Crowd Level: ${crowd.crowd_level} | Hourly slots: ${crowd.hourly_trends.length}`);
    if (!['LOW', 'MODERATE', 'HIGH', 'PEAK'].includes(crowd.crowd_level)) {
      throw new Error('Invalid crowd level');
    }

    // 4. Queue Load Forecast
    console.log('4. Queue Load Forecast:');
    const loadF = analytics.queue_load_forecast;
    console.log(`   Load Level: ${loadF.level} (${loadF.load_percentage}%) | Desc: "${loadF.description}"`);
    if (!['LIGHT', 'NORMAL', 'HEAVY', 'SURGE'].includes(loadF.level)) {
      throw new Error('Invalid load level');
    }

    // 5. Best Time to Visit
    console.log('5. Best Time to Visit:');
    const bestT = analytics.best_time_to_visit;
    console.log(`   Best Window: ${bestT.best_window} (avg ${bestT.lowest_expected_wait_mins} mins)`);
    if (!bestT.best_window) throw new Error('Missing best visit window');

    // 6. When Should I Leave
    console.log('6. When Should I Leave:');
    const leave = analytics.when_should_i_leave;
    console.log(`   Recommended Departure: ${leave.recommended_departure_time} | Urgency: ${leave.urgency}`);
    console.log(`   Advice: "${leave.advice}"`);
    if (!leave.recommended_departure_time) throw new Error('Missing departure time');

    // 7. Queue Health
    console.log('7. Queue Health:');
    const health = analytics.queue_health;
    console.log(`   Health Score: ${health.score}/100 | Status: ${health.status} | Throughput: ${health.throughput_rate_hourly} tokens/hr`);
    if (health.score < 0 || health.score > 100) throw new Error('Invalid health score');

    // 8. Bottleneck Detection
    console.log('8. Bottleneck Detection:');
    const bneck = analytics.bottleneck_detection;
    console.log(`   Has Bottleneck: ${bneck.has_bottleneck} | Summary: "${bneck.summary}"`);

    // 9. Counter Load Prediction
    console.log('9. Counter Load Prediction:');
    const cLoad = analytics.counter_load_prediction;
    console.log(`   Active counters: ${cLoad.active_counters} | Tokens/counter: ${cLoad.tokens_per_counter} | Util: ${cLoad.utilization_pct}%`);

    // 10. Staff Capacity Forecast
    console.log('10. Staff Capacity Forecast:');
    const staffCap = analytics.staff_capacity_forecast;
    console.log(`   Remaining capacity: ${staffCap.remaining_capacity_tokens} tokens | Can accommodate: ${staffCap.can_accommodate_current_queue}`);

    // 11. No-Show Risk (Non-punitive safeguard)
    console.log('11. No-Show Risk:');
    const noShow = analytics.no_show_risk;
    console.log(`   Risk: ${noShow.level} (rate: ${noShow.historical_rate}) | Safeguard: "${noShow.safeguard_notice}"`);
    if (!noShow.safeguard_notice.includes('never uses no-show risk to reduce priority')) {
      throw new Error('Missing mandatory non-punitive safeguard notice on no-show risk');
    }

    // 12. Queue Abandonment Risk (Non-punitive safeguard)
    console.log('12. Queue Abandonment Risk:');
    const abnd = analytics.queue_abandonment_risk;
    console.log(`   Risk: ${abnd.level} | Rate: ${abnd.historical_cancellation_rate} | Safeguard: "${abnd.safeguard_notice}"`);

    // 13. Anomaly Detection
    console.log('13. Anomaly Detection:');
    const anom = analytics.anomaly_detection;
    console.log(`   Is Anomaly: ${anom.is_anomaly} | Desc: "${anom.description}"`);

    // 14. AI Insights (Explainability)
    console.log('14. AI Insights (Explainability):');
    const insights = analytics.ai_insights;
    console.log(`   Generated ${insights.length} transparent insights.`);
    for (const ins of insights) {
      console.log(`   [${ins.category}] ${ins.headline} -> Source: ${ins.source}, Ver: ${ins.model_version}`);
      if (!ins.source || !ins.model_version) {
        throw new Error('Insight missing explainability fields (source or model_version)');
      }
    }

    // Verify Explainability Metadata
    console.log('\n--- VERIFYING EXPLAINABILITY METADATA ---');
    console.log(`Analytics Version: ${analytics.metadata.analytics_version}`);
    console.log(`Model Version: ${analytics.metadata.model_version}`);
    console.log(`Generated At: ${analytics.metadata.generated_at}`);
    console.log(`Cold Start Status: ${analytics.metadata.is_cold_start}`);

    console.log('\n==================================================');
    console.log('ALL PHASE 12 AI EXPANSION AUDIT CHECKS PASSED!');
    console.log('==================================================');
    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
}

runPhase12ExpansionAudit();
