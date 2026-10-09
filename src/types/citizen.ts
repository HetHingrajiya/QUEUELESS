import { TokenStatus } from '@/models/Token';
import { QueueLoadLevel, QueueLoadInfo } from '@/lib/queue/metrics';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface WorkingHourRule {
  day: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
}

export interface CitizenOffice {
  _id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  district?: string;
  pincode?: string;
  contactNumber?: string;
  email?: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  distanceFormatted?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  servicesCount?: number;
  activeCountersCount?: number;
  countersCount?: number;
  waitingCount?: number;
  estimatedWaitMinutes?: number;
  queueLoadLevel?: QueueLoadLevel;
  workingHours?: WorkingHourRule[];
  operatingHours?: string;
  department?: string;
  services?: CitizenService[];
  isFavorite?: boolean;
}

export interface CitizenService {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  officeId?: string;
  officeName?: string;
  office?: CitizenOffice;
  averageServiceTime?: number;
  averageServiceTimeMinutes?: number;
  estimatedServiceTime?: number;
  estimatedTime?: number;
  waitingCount?: number;
  estimatedWaitMinutes?: number;
  estimatedWaitMin?: number;
  activeCounters?: number;
  activeCountersCount?: number;
  queueLoad?: QueueLoadLevel | QueueLoadInfo;
  status?: 'ACTIVE' | 'INACTIVE';
  requiredDocuments?: string[];
  category?: string;
  distanceFormatted?: string;
  fee?: number;
}

export interface CitizenTransferDetails {
  previousCounterName?: string;
  newCounterName?: string;
  transferTime?: string | Date;
}

export interface CitizenToken {
  _id: string;
  id?: string;
  tokenNumber: string;
  status: TokenStatus;
  officeId?: string | { _id: string; name: string };
  officeName?: string;
  office?: CitizenOffice;
  serviceId?: string | { _id: string; name: string };
  serviceName?: string;
  service?: CitizenService;
  counterId?: string | { _id: string; name: string; number?: number };
  counterName?: string;
  counterNumber?: number | string;
  counter?: { _id?: string; name: string; number?: number | string };
  officeLatitude?: number | null;
  officeLongitude?: number | null;
  address?: string;
  priority?: 'NORMAL' | 'VIP' | 'SENIOR' | 'EMERGENCY';
  position?: number;
  peopleAhead?: number;
  estimatedWaitMin?: number;
  nowServing?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  date?: string;
  checkInTime?: string | Date | null;
  callTime?: string | Date | null;
  calledAt?: string | Date | null;
  startTime?: string | Date | null;
  completionTime?: string | Date | null;
  completedAt?: string | Date | null;
  endTime?: string | Date | null;
  processingTime?: number | null;
  waitMinutes?: number;
  serviceDuration?: number | string;
  cancellationReason?: string | null;
  notes?: string | null;
  cancelledAt?: string | Date | null;
  transferDetails?: CitizenTransferDetails | null;
  timeline?: { status: string; timestamp: string | Date; note?: string }[];
  feedback?: CitizenFeedback | null;
  token?: CitizenToken;
}

export interface CitizenTokenHistoryDetail {
  token: CitizenToken;
  office?: CitizenOffice;
  service?: CitizenService;
  counter?: { _id?: string; name: string; counterNumber?: number };
  timeline?: Array<{ eventType: string; time: string | Date; details?: unknown }>;
  feedback?: { rating: number; comment?: string; createdAt: string | Date } | null;
}

export interface CitizenQueueSummary {
  token: CitizenToken;
  nowServing?: string | {
    tokenNumber: string;
    counterName: string;
  } | null;
  peopleAhead: number;
  estimatedWaitMin: number;
  nextTokens?: Array<{
    tokenNumber: string;
    status: string;
  } | string>;
  aiConfidence?: number | null;
  predictionSource?: string;
  queueLoad?: QueueLoadLevel;
  transferDetails?: CitizenTransferDetails | null;
}

export interface QueueMetrics {
  waitingCount: number;
  currentlyServingCount: number;
  completedCount: number;
  activeCountersCount: number;
  activeCounters?: number;
  averageServiceTimeMinutes: number;
  estimatedWaitMinutes: number;
  estimatedTime?: number;
  throughputPerHour: number;
  queueLoad: QueueLoadInfo;
  peopleAhead?: number;
  queuePosition?: number;
}

export interface CitizenNotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'QUEUE_UPDATE' | 'TOKEN_CALLED' | 'GENERAL' | 'SYSTEM';
  isRead: boolean;
  officeId?: string | { _id: string; name: string };
  officeName?: string;
  createdAt: string | Date;
  metadata?: Record<string, unknown>;
}

export type Notification = CitizenNotification;

export interface SupportTicket {
  _id: string;
  userId?: string;
  subject: string;
  category?: string;
  message: string;
  status?: string;
  adminReply?: string;
  createdAt?: string | Date;
}

export interface CitizenFavorite {
  _id: string;
  userId: string;
  officeId: CitizenOffice;
  office?: CitizenOffice;
  waitingCount?: number;
  estimatedWaitMinutes?: number;
  createdAt: string | Date;
}

export type Favorite = CitizenFavorite;

export interface CitizenFeedback {
  _id: string;
  citizenId: string;
  tokenId?: string;
  token?: string | { _id: string; tokenNumber: string };
  officeId: string | { _id: string; name: string };
  officeName?: string;
  office?: string | { _id: string; name: string };
  serviceId?: string | { _id: string; name: string };
  serviceName?: string;
  service?: string | { _id: string; name: string };
  rating: number;
  comment?: string;
  categories?: string[];
  officeResponse?: string;
  status?: string;
  createdAt: string | Date;
}

export type Feedback = CitizenFeedback;

export interface AIPredictionFactor {
  name: string;
  impact: 'High Impact' | 'Medium Impact' | 'Low Impact';
  desc: string;
  positive: boolean;
}

export interface AIPrediction {
  tokenNumber: string;
  serviceName: string;
  predictedWaitTime: number;
  confidence: number | null;
  predictionSource: string;
  waitingAhead: number;
  activeCounters: number;
  queueLoad: string;
  modelVersion: string;
  predictionTimestamp: string;
  factors: Record<string, string> | AIPredictionFactor[];
  crowdPrediction?: { level: string; confidence: number; label?: string; hourly_trends?: Array<{ hour: string; crowd_level: string }> };
  queueHealth?: { score: number; status: string; factors?: string[] };
  serviceTimePrediction?: { duration: number; range?: string; predicted_service_time_mins?: number };
  bestTimeToVisit?: { time: string; reason?: string; best_window?: string };
}

export interface AIInsight {
  category: string;
  headline: string;
  detail: string;
  recommendation: string;
  source: string;
  confidence: number | null;
  model_version: string;
  is_fallback: boolean;
}

export interface CitizenProfileSettings {
  language: string;
  notifications: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  privacy: {
    locationTracking: boolean;
    telemetry: boolean;
    auditLogVisibility: boolean;
  };
}

export interface CitizenProfile {
  _id: string;
  fullName: string;
  name?: string;
  email: string;
  mobile?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  role: 'CITIZEN';
  status: 'ACTIVE' | 'INACTIVE';
  settings?: CitizenProfileSettings;
  darkMode?: boolean;
  biometric?: boolean;
  createdAt?: string | Date;
}

export interface LeaveTimeData {
  tokenNumber: string;
  travelTimeAvailable: boolean;
  recommendedDepartureFormatted?: string;
  recommendedDepartureTime?: string;
  travelDurationMinutes?: number;
  travelTimeMinutes?: number;
  travelDistanceKm?: number;
  distanceKm?: number;
  leaveInMinutes?: number;
  routingProvider?: string;
  predictedWaitMinutes: number;
  targetArrivalTime?: string;
  expectedCallTime?: string;
  checkInBufferMinutes?: number;
  advice?: string;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  officeName?: string;
  formula?: {
    recommendedDeparture?: string;
    currentTime?: string;
    travelMinutes?: number;
    predictedWaitAdjustmentMinutes?: number;
    bufferMinutes?: number;
  };
}
