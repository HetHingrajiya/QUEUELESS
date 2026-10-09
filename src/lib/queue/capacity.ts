import mongoose from 'mongoose';
import { Token, TokenStatus } from '@/models/Token';
import { Counter, CounterStatus, ICounter } from '@/models/Counter';
import { Service, IService } from '@/models/Service';
import { Office, IOffice } from '@/models/Office';
import { getTodayDateRange } from './metrics';

export interface ServiceCapacityMetrics {
  serviceId: string;
  serviceName: string;
  officeId: string;
  averageServiceTime: number; // in minutes
  totalDailyCapacity: number; // calculated total tokens for today
  tokensIssuedToday: number; // tokens booked today
  remainingTokensToday: number; // remaining tokens available to book
  isQuotaFull: boolean;
  bookedPercentage: number;
  operatingMinutesAllocated: number; // total counter minutes allocated to this service
  activeCountersCount: number; // number of counters serving this service
  counterDistributionInfo: string;
  workingHoursText: string;
}

/**
 * Calculates operating minutes from an Office's workingHours or default hours.
 */
function calculateOfficeOperatingMinutes(office: IOffice | null): { totalMinutes: number; hoursText: string } {
  if (!office) {
    return { totalMinutes: 420, hoursText: '09:00 AM - 05:00 PM' };
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const currentDay = dayNames[new Date().getDay()];

  let openTimeStr = office.openingTime || '09:00';
  let closeTimeStr = office.closingTime || '17:00';
  let breakStartStr: string | undefined = undefined;
  let breakEndStr: string | undefined = undefined;

  if (office.workingHours && office.workingHours.length > 0) {
    const todayHours = office.workingHours.find((w: any) => w.day === currentDay);
    if (todayHours) {
      if (!todayHours.isOpen) {
        return { totalMinutes: 0, hoursText: 'Closed Today' };
      }
      openTimeStr = todayHours.openingTime || openTimeStr;
      closeTimeStr = todayHours.closingTime || closeTimeStr;
      breakStartStr = todayHours.breakStartTime;
      breakEndStr = todayHours.breakEndTime;
    }
  }

  const parseTimeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return (isNaN(h) ? 9 : h) * 60 + (isNaN(m) ? 0 : m);
  };

  const openMinutes = parseTimeToMinutes(openTimeStr);
  const closeMinutes = parseTimeToMinutes(closeTimeStr);
  let totalSpan = Math.max(0, closeMinutes - openMinutes);

  if (breakStartStr && breakEndStr) {
    const breakStart = parseTimeToMinutes(breakStartStr);
    const breakEnd = parseTimeToMinutes(breakEndStr);
    const breakSpan = Math.max(0, breakEnd - breakStart);
    totalSpan = Math.max(0, totalSpan - breakSpan);
  }

  // Ensure reasonable default (at least 240 mins if office is open)
  const effectiveMinutes = totalSpan > 60 ? totalSpan : 420;

  return {
    totalMinutes: effectiveMinutes,
    hoursText: `${openTimeStr} - ${closeTimeStr}`
  };
}

/**
 * Service to calculate daily time-weighted capacity for services and counters.
 */
export class ServiceCapacityService {
  /**
   * Calculates time-weighted daily token capacity for a single service in an office.
   */
  static async getServiceCapacity(
    officeId: string | mongoose.Types.ObjectId,
    serviceId: string | mongoose.Types.ObjectId
  ): Promise<ServiceCapacityMetrics> {
    const office = await Office.findById(officeId).lean();
    const service = await Service.findById(serviceId).lean();

    if (!service) {
      return {
        serviceId: serviceId.toString(),
        serviceName: 'Unknown Service',
        officeId: officeId.toString(),
        averageServiceTime: 10,
        totalDailyCapacity: 50,
        tokensIssuedToday: 0,
        remainingTokensToday: 50,
        isQuotaFull: false,
        bookedPercentage: 0,
        operatingMinutesAllocated: 210,
        activeCountersCount: 1,
        counterDistributionInfo: '1 Counter',
        workingHoursText: '09:00 AM - 05:00 PM'
      };
    }

    const { totalMinutes: operatingMinutes, hoursText } = calculateOfficeOperatingMinutes(office as any);

    // Fetch all active counters for this office (or all counters as fallback)
    let counters = await Counter.find({ officeId, status: CounterStatus.ACTIVE }).lean();
    if (counters.length === 0) {
      counters = await Counter.find({ officeId }).lean();
    }

    // Count all active services for this office (to distribute unassigned counters)
    const allServicesInOffice = await Service.find({ officeId, status: 'ACTIVE' }).select('_id').lean();
    const totalServicesCount = Math.max(1, allServicesInOffice.length);

    let totalServiceMinutes = 0;
    let assignedCountersCount = 0;
    const sIdStr = service._id.toString();

    // If counters exist, calculate allocated minutes per counter
    if (counters.length > 0) {
      for (const counter of counters) {
        const cServiceIds = (counter.serviceIds || []).map((id: any) => id.toString());
        
        if (cServiceIds.length > 0) {
          // Counter has dedicated services
          if (cServiceIds.includes(sIdStr)) {
            assignedCountersCount++;
            // Operating time is shared equally across services assigned to this counter
            const minutesForThisService = Math.floor(operatingMinutes / cServiceIds.length);
            totalServiceMinutes += minutesForThisService;
          }
        } else {
          // General counter: serves all services in the office
          assignedCountersCount++;
          const minutesForThisService = Math.floor(operatingMinutes / totalServicesCount);
          totalServiceMinutes += minutesForThisService;
        }
      }
    } else {
      // Fallback: 1 default virtual counter operating the full day, split among services
      assignedCountersCount = 1;
      totalServiceMinutes = Math.floor(operatingMinutes / totalServicesCount);
    }

    const avgTime = Math.max(1, Number(service.averageServiceTime) || 10);
    
    // Model B: Time-Weighted Token Allocation
    // Number of tokens = allocated operating minutes / average service duration
    let calculatedCapacity = Math.floor(totalServiceMinutes / avgTime);

    // If office is open, ensure a reasonable minimum of at least 15 tokens
    if (operatingMinutes > 0) {
      calculatedCapacity = Math.max(15, calculatedCapacity);
    }

    // If service has explicit dailyTokenLimit set by admin, honor it as cap
    if (typeof service.dailyTokenLimit === 'number' && service.dailyTokenLimit > 0) {
      calculatedCapacity = Math.min(calculatedCapacity, service.dailyTokenLimit);
    }

    // Query tokens created today for this service (excluding CANCELLED)
    const { startOfDay, endOfDay } = getTodayDateRange();
    const tokensIssuedToday = await Token.countDocuments({
      officeId,
      serviceId,
      status: { $ne: TokenStatus.CANCELLED },
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const remainingTokensToday = Math.max(0, calculatedCapacity - tokensIssuedToday);
    const isQuotaFull = remainingTokensToday <= 0;
    const bookedPercentage = calculatedCapacity > 0
      ? Math.min(100, Math.round((tokensIssuedToday / calculatedCapacity) * 100))
      : 100;

    const counterDistributionInfo = assignedCountersCount > 0
      ? `${assignedCountersCount} Counter${assignedCountersCount > 1 ? 's' : ''} Allocated`
      : 'Standard Capacity';

    return {
      serviceId: sIdStr,
      serviceName: service.name,
      officeId: officeId.toString(),
      averageServiceTime: avgTime,
      totalDailyCapacity: calculatedCapacity,
      tokensIssuedToday,
      remainingTokensToday,
      isQuotaFull,
      bookedPercentage,
      operatingMinutesAllocated: totalServiceMinutes,
      activeCountersCount: assignedCountersCount,
      counterDistributionInfo,
      workingHoursText: hoursText
    };
  }

  /**
   * Calculates capacities for all active services in an office in batch.
   */
  static async getOfficeServicesCapacities(
    officeId: string | mongoose.Types.ObjectId
  ): Promise<Record<string, ServiceCapacityMetrics>> {
    const services = await Service.find({ officeId, status: 'ACTIVE' }).select('_id').lean();
    const result: Record<string, ServiceCapacityMetrics> = {};

    await Promise.all(
      services.map(async (s) => {
        const capacity = await this.getServiceCapacity(officeId, s._id);
        result[s._id.toString()] = capacity;
      })
    );

    return result;
  }
}
