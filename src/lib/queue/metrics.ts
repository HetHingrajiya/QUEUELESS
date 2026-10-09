import mongoose from 'mongoose';
import { Token, TokenStatus } from '@/models/Token';
import { Counter, CounterStatus } from '@/models/Counter';
import { Service } from '@/models/Service';
import { Office } from '@/models/Office';
import { 
  WAITING_TOKEN_STATUSES, 
  SERVING_TOKEN_STATUSES, 
  calculateEstimatedWaitTime as baseCalculateWait,
  calculateRecommendedArrivalTime as baseCalculateArrival
} from './index';

export interface QueueMetricsScope {
  organizationId?: string | mongoose.Types.ObjectId;
  officeId?: string | mongoose.Types.ObjectId;
  serviceId?: string | mongoose.Types.ObjectId;
}

export type QueueLoadLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface QueueLoadInfo {
  level: QueueLoadLevel;
  ratio: number; // waiting count per active counter
  description: string;
}

export interface ServiceQueueMetrics {
  serviceId: string;
  serviceName: string;
  waitingCount: number;
  currentlyServingCount: number;
  completedCount: number;
  activeCountersCount: number;
  averageServiceTimeMinutes: number;
  estimatedWaitMinutes: number;
  throughputPerHour: number;
  queueLoad: QueueLoadInfo;
}

export interface OfficeQueueMetrics {
  officeId: string;
  officeName: string;
  waitingCount: number;
  currentlyServingCount: number;
  completedCount: number;
  activeCountersCount: number;
  averageServiceTimeMinutes: number;
  estimatedWaitMinutes: number;
  throughputPerHour: number;
  queueLoad: QueueLoadInfo;
  services?: ServiceQueueMetrics[];
}

export interface TokenPositionMetrics {
  tokenId: string;
  tokenNumber: string;
  status: TokenStatus;
  peopleAhead: number;
  queuePosition: number;
  estimatedWaitMinutes: number;
  averageServiceTimeMinutes: number;
  activeCountersCount: number;
  nowServing: string | null;
  servingTokens: string[];
  nextTokens: string[];
  queueLoad: QueueLoadInfo;
}

/**
 * Returns start and end timestamps for the current day.
 */
export function getTodayDateRange(): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
}

/**
 * Centralized Queue Metrics Service.
 * Provides unified, real-time metrics for tokens, counters, waiting times, and queue load.
 */
export class QueueMetricsService {
  /**
   * Calculates the count of waiting tokens for a given scope today.
   */
  static async getWaitingCount(scope: QueueMetricsScope): Promise<number> {
    const { startOfDay, endOfDay } = getTodayDateRange();
    const query: any = {
      status: { $in: WAITING_TOKEN_STATUSES },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    };

    if (scope.officeId) query.officeId = scope.officeId;
    if (scope.serviceId) query.serviceId = scope.serviceId;
    if (scope.organizationId) query.organizationId = scope.organizationId;

    return await Token.countDocuments(query);
  }

  /**
   * Calculates the count of tokens currently being served or called for a given scope today.
   */
  static async getCurrentlyServingCount(scope: QueueMetricsScope): Promise<number> {
    const { startOfDay, endOfDay } = getTodayDateRange();
    const query: any = {
      status: { $in: SERVING_TOKEN_STATUSES },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    };

    if (scope.officeId) query.officeId = scope.officeId;
    if (scope.serviceId) query.serviceId = scope.serviceId;
    if (scope.organizationId) query.organizationId = scope.organizationId;

    return await Token.countDocuments(query);
  }

  /**
   * Calculates the count of completed tokens for a given scope today.
   */
  static async getCompletedCount(scope: QueueMetricsScope): Promise<number> {
    const { startOfDay, endOfDay } = getTodayDateRange();
    const query: any = {
      status: TokenStatus.COMPLETED,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    };

    if (scope.officeId) query.officeId = scope.officeId;
    if (scope.serviceId) query.serviceId = scope.serviceId;
    if (scope.organizationId) query.organizationId = scope.organizationId;

    return await Token.countDocuments(query);
  }

  /**
   * Calculates the number of active counters serving an office and optional service.
   * Scoped strictly by officeId.
   */
  static async getActiveCountersCount(
    officeId: string | mongoose.Types.ObjectId,
    serviceId?: string | mongoose.Types.ObjectId
  ): Promise<number> {
    if (!officeId) return 1;

    const counterQuery: any = {
      officeId,
      status: CounterStatus.ACTIVE
    };

    if (serviceId) {
      counterQuery.$or = [
        { serviceIds: { $exists: false } },
        { serviceIds: { $size: 0 } },
        { serviceIds: serviceId }
      ];
    }

    const count = await Counter.countDocuments(counterQuery);
    return Math.max(1, count);
  }

  /**
   * Calculates the average service time in minutes from real completed tokens in MongoDB.
   * If no completed token history exists, gracefully falls back to the configured
   * service duration from the database.
   */
  static async getAverageServiceTime(
    officeId?: string | mongoose.Types.ObjectId,
    serviceId?: string | mongoose.Types.ObjectId
  ): Promise<number> {
    const query: any = { status: TokenStatus.COMPLETED };
    if (officeId) query.officeId = officeId;
    if (serviceId) query.serviceId = serviceId;

    // Fetch up to 50 most recent completed tokens
    const recentCompleted = await Token.find(query)
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('startTime completionTime completedAt callTime processingTime')
      .lean();

    let totalMinutes = 0;
    let validSamples = 0;

    for (const tok of recentCompleted) {
      let durationMinutes = 0;
      if (typeof (tok as any).processingTime === 'number' && (tok as any).processingTime > 0) {
        durationMinutes = Math.round((tok as any).processingTime / 60);
      } else {
        const endTime = (tok as any).completionTime || (tok as any).completedAt;
        const beginTime = (tok as any).startTime || (tok as any).callTime;
        if (endTime && beginTime) {
          const diffMs = new Date(endTime).getTime() - new Date(beginTime).getTime();
          if (diffMs > 0) {
            durationMinutes = Math.round(diffMs / 60000);
          }
        }
      }

      // Filter reasonable human service durations (between 1 and 180 minutes)
      if (durationMinutes >= 1 && durationMinutes <= 180) {
        totalMinutes += durationMinutes;
        validSamples++;
      }
    }

    if (validSamples > 0) {
      return Math.max(1, Math.round(totalMinutes / validSamples));
    }

    // Fallback: Real service duration defined in Service collection
    if (serviceId) {
      const service = await Service.findById(serviceId).select('averageServiceTime estimatedServiceTime').lean();
      if (service) {
        const configured = (service as any).averageServiceTime || (service as any).estimatedServiceTime;
        if (configured && typeof configured === 'number' && configured > 0) {
          return configured;
        }
      }
    }

    // Fallback: Average of services in the office
    if (officeId) {
      const services = await Service.find({ officeId, status: 'ACTIVE' }).select('averageServiceTime estimatedServiceTime').lean();
      if (services.length > 0) {
        const sum = services.reduce((acc, s: any) => acc + (s.averageServiceTime || s.estimatedServiceTime || 0), 0);
        const avg = Math.round(sum / services.length);
        if (avg > 0) return avg;
      }
    }

    return 5;
  }

  /**
   * Calculates estimated wait time in minutes based on waiting count, average service time, and active counters.
   */
  static calculateEstimatedWaitTime(
    waitingCount: number,
    averageServiceTimeMinutes: number = 5,
    activeCounters: number = 1
  ): number {
    return baseCalculateWait(waitingCount, averageServiceTimeMinutes, activeCounters);
  }

  /**
   * Calculates recommended arrival time with buffer.
   */
  static calculateRecommendedArrivalTime(
    estimatedWaitMinutes: number,
    checkInBufferMinutes: number = 15,
    baseTime: Date = new Date()
  ): Date {
    return baseCalculateArrival(estimatedWaitMinutes, checkInBufferMinutes, baseTime);
  }

  /**
   * Calculates queue load category and ratio.
   */
  static calculateQueueLoad(waitingCount: number, activeCounters: number = 1): QueueLoadInfo {
    const safeCounters = Math.max(1, activeCounters);
    const ratio = Number((waitingCount / safeCounters).toFixed(1));

    let level: QueueLoadLevel = 'LOW';
    let description = 'Minimal waiting time';

    if (ratio > 10) {
      level = 'CRITICAL';
      description = 'Heavy queue backlog; extended wait expected';
    } else if (ratio > 5) {
      level = 'HIGH';
      description = 'Busy queue; longer wait expected';
    } else if (ratio > 2) {
      level = 'MODERATE';
      description = 'Normal operating queue load';
    }

    return { level, ratio, description };
  }

  /**
   * Calculates throughput (completed tokens per hour) for the given scope.
   */
  static async getQueueThroughput(
    officeId?: string | mongoose.Types.ObjectId,
    serviceId?: string | mongoose.Types.ObjectId
  ): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const query: any = {
      status: TokenStatus.COMPLETED,
      updatedAt: { $gte: oneHourAgo }
    };
    if (officeId) query.officeId = officeId;
    if (serviceId) query.serviceId = serviceId;

    const completedInLastHour = await Token.countDocuments(query);
    if (completedInLastHour > 0) {
      return completedInLastHour;
    }

    const { startOfDay } = getTodayDateRange();
    const totalCompletedToday = await Token.countDocuments({
      ...query,
      updatedAt: { $gte: startOfDay }
    });

    const hoursElapsedToday = Math.max(1, (Date.now() - startOfDay.getTime()) / (1000 * 60 * 60));
    return Number((totalCompletedToday / hoursElapsedToday).toFixed(1));
  }

  /**
   * Calculates complete position metrics for an individual citizen token.
   * Enforces citizen ownership and exact office/service scoping.
   */
  static async getTokenPositionMetrics(
    tokenId: string | mongoose.Types.ObjectId,
    citizenId: string | mongoose.Types.ObjectId
  ): Promise<TokenPositionMetrics | null> {
    const token = await Token.findOne({ _id: tokenId, citizenId })
      .populate('serviceId', 'name averageServiceTime estimatedServiceTime')
      .populate('officeId', 'name')
      .populate('counterId', 'name number')
      .lean();

    if (!token) {
      return null;
    }

    const officeId = (token.officeId as any)?._id || token.officeId;
    const serviceId = (token.serviceId as any)?._id || token.serviceId;
    const { startOfDay, endOfDay } = getTodayDateRange();

    // Now serving tokens in this service/office today
    const servingTokensDocs = await Token.find({
      officeId,
      serviceId,
      status: { $in: SERVING_TOKEN_STATUSES },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ callTime: -1 }).select('tokenNumber').lean();

    const servingTokens = servingTokensDocs.map((t: any) => t.tokenNumber);
    const nowServing = servingTokens.length > 0 ? servingTokens[0] : null;

    // Calculate people ahead
    let peopleAhead = 0;
    let queuePosition = 0;

    if (WAITING_TOKEN_STATUSES.includes(token.status as any)) {
      peopleAhead = await Token.countDocuments({
        officeId,
        serviceId,
        status: { $in: WAITING_TOKEN_STATUSES },
        createdAt: { $gte: startOfDay, $lt: token.createdAt }
      });
      queuePosition = peopleAhead + 1;
    }

    // Next 5 tokens waiting in line
    const nextTokensDocs = await Token.find({
      officeId,
      serviceId,
      status: { $in: WAITING_TOKEN_STATUSES },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: 1 }).limit(5).select('tokenNumber').lean();

    const nextTokens = nextTokensDocs.map((t: any) => t.tokenNumber);

    const activeCountersCount = await QueueMetricsService.getActiveCountersCount(officeId, serviceId);
    const averageServiceTimeMinutes = await QueueMetricsService.getAverageServiceTime(officeId, serviceId);
    const estimatedWaitMinutes = QueueMetricsService.calculateEstimatedWaitTime(
      peopleAhead,
      averageServiceTimeMinutes,
      activeCountersCount
    );
    const queueLoad = QueueMetricsService.calculateQueueLoad(peopleAhead, activeCountersCount);

    return {
      tokenId: token._id.toString(),
      tokenNumber: token.tokenNumber,
      status: token.status as TokenStatus,
      peopleAhead,
      queuePosition,
      estimatedWaitMinutes,
      averageServiceTimeMinutes,
      activeCountersCount,
      nowServing,
      servingTokens,
      nextTokens,
      queueLoad
    };
  }

  /**
   * Retrieves aggregated queue metrics for a specific service in an office.
   */
  static async getServiceMetrics(
    officeId: string | mongoose.Types.ObjectId,
    serviceId: string | mongoose.Types.ObjectId
  ): Promise<ServiceQueueMetrics> {
    const service = await Service.findById(serviceId).select('name averageServiceTime').lean();
    const serviceName = service?.name || 'Service';

    const [waitingCount, currentlyServingCount, completedCount, activeCountersCount, averageServiceTimeMinutes, throughputPerHour] = await Promise.all([
      QueueMetricsService.getWaitingCount({ officeId, serviceId }),
      QueueMetricsService.getCurrentlyServingCount({ officeId, serviceId }),
      QueueMetricsService.getCompletedCount({ officeId, serviceId }),
      QueueMetricsService.getActiveCountersCount(officeId, serviceId),
      QueueMetricsService.getAverageServiceTime(officeId, serviceId),
      QueueMetricsService.getQueueThroughput(officeId, serviceId),
    ]);

    const estimatedWaitMinutes = QueueMetricsService.calculateEstimatedWaitTime(
      waitingCount,
      averageServiceTimeMinutes,
      activeCountersCount
    );

    const queueLoad = QueueMetricsService.calculateQueueLoad(waitingCount, activeCountersCount);

    return {
      serviceId: serviceId.toString(),
      serviceName,
      waitingCount,
      currentlyServingCount,
      completedCount,
      activeCountersCount,
      averageServiceTimeMinutes,
      estimatedWaitMinutes,
      throughputPerHour,
      queueLoad
    };
  }

  /**
   * Retrieves aggregated queue metrics for an entire office.
   */
  static async getOfficeMetrics(
    officeId: string | mongoose.Types.ObjectId,
    includeServices: boolean = false
  ): Promise<OfficeQueueMetrics> {
    const office = await Office.findById(officeId).select('name').lean();
    const officeName = office?.name || 'Office';

    const [waitingCount, currentlyServingCount, completedCount, activeCountersCount, averageServiceTimeMinutes, throughputPerHour] = await Promise.all([
      QueueMetricsService.getWaitingCount({ officeId }),
      QueueMetricsService.getCurrentlyServingCount({ officeId }),
      QueueMetricsService.getCompletedCount({ officeId }),
      QueueMetricsService.getActiveCountersCount(officeId),
      QueueMetricsService.getAverageServiceTime(officeId),
      QueueMetricsService.getQueueThroughput(officeId),
    ]);

    const estimatedWaitMinutes = QueueMetricsService.calculateEstimatedWaitTime(
      waitingCount,
      averageServiceTimeMinutes,
      activeCountersCount
    );

    const queueLoad = QueueMetricsService.calculateQueueLoad(waitingCount, activeCountersCount);

    let servicesMetrics: ServiceQueueMetrics[] | undefined;
    if (includeServices) {
      const services = await Service.find({ officeId, status: 'ACTIVE' }).select('_id').lean();
      servicesMetrics = await Promise.all(
        services.map(s => QueueMetricsService.getServiceMetrics(officeId, s._id))
      );
    }

    return {
      officeId: officeId.toString(),
      officeName,
      waitingCount,
      currentlyServingCount,
      completedCount,
      activeCountersCount,
      averageServiceTimeMinutes,
      estimatedWaitMinutes,
      throughputPerHour,
      queueLoad,
      services: servicesMetrics
    };
  }
}
