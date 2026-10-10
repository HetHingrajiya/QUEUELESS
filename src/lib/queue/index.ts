import { TokenStatus } from '@/models/Token';

/**
 * Centralized definition of active token statuses for SamaySetu.
 * A token in any of these statuses is considered active in the queue.
 */
export const ACTIVE_TOKEN_STATUSES: readonly TokenStatus[] = [
  TokenStatus.WAITING,
  TokenStatus.CALLED,
  TokenStatus.CHECKED_IN,
  TokenStatus.SERVING,
] as const;

/**
 * Tokens currently being served or called to counter.
 */
export const SERVING_TOKEN_STATUSES: readonly TokenStatus[] = [
  TokenStatus.CALLED,
  TokenStatus.SERVING,
] as const;

/**
 * Tokens actively waiting in line (not yet called or served).
 */
export const WAITING_TOKEN_STATUSES: readonly TokenStatus[] = [
  TokenStatus.WAITING,
  TokenStatus.CHECKED_IN,
] as const;

/**
 * Terminal token statuses (queue lifecycle finished).
 */
export const TERMINAL_TOKEN_STATUSES: readonly TokenStatus[] = [
  TokenStatus.COMPLETED,
  TokenStatus.CANCELLED,
  TokenStatus.NO_SHOW,
  TokenStatus.SKIPPED,
] as const;

/**
 * Canonical QueueEvent types.
 */
export const QueueEventTypes = {
  CREATED: 'CREATED',
  CHECKED_IN: 'CHECKED_IN',
  CALLED: 'CALLED',
  SERVING: 'SERVING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  SKIPPED: 'SKIPPED',
  TRANSFERRED: 'TRANSFERRED',
} as const;

export type QueueEventType = typeof QueueEventTypes[keyof typeof QueueEventTypes];

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  isIdempotent?: boolean;
}

/**
 * Validates if a citizen token can transition to CHECKED_IN.
 */
export function canCheckIn(status: TokenStatus): ValidationResult {
  if (status === TokenStatus.CHECKED_IN) {
    return { allowed: true, isIdempotent: true, reason: 'Token is already checked in' };
  }
  if (status === TokenStatus.WAITING || status === TokenStatus.CALLED) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Cannot check in token with status ${status}. Only WAITING or CALLED tokens can be checked in.`
  };
}

/**
 * Validates if a citizen token can be cancelled.
 */
export function canCancel(status: TokenStatus): ValidationResult {
  if (TERMINAL_TOKEN_STATUSES.includes(status)) {
    return {
      allowed: false,
      reason: `Token cannot be cancelled because it is already ${status}`
    };
  }
  if (status === TokenStatus.SERVING) {
    return {
      allowed: false,
      reason: 'Token is currently being served and cannot be cancelled by citizen'
    };
  }
  if ([TokenStatus.WAITING, TokenStatus.CHECKED_IN, TokenStatus.CALLED].includes(status)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Cannot cancel token with status ${status}`
  };
}

/**
 * Estimates wait time in minutes based on waiting tokens count, average duration, and active counters.
 */
export function calculateEstimatedWaitTime(
  waitingAhead: number,
  averageServiceTimeMinutes: number = 10,
  activeCounters: number = 1
): number {
  const safeCounters = Math.max(1, activeCounters);
  const safeAvgTime = Math.max(1, averageServiceTimeMinutes);
  return Math.ceil((waitingAhead * safeAvgTime) / safeCounters);
}

/**
 * Calculates recommended arrival time with buffer.
 */
export function calculateRecommendedArrivalTime(
  estimatedWaitMinutes: number,
  checkInBufferMinutes: number = 15,
  baseTime: Date = new Date()
): Date {
  const waitMs = estimatedWaitMinutes * 60 * 1000;
  const bufferMs = checkInBufferMinutes * 60 * 1000;
  return new Date(baseTime.getTime() + Math.max(0, waitMs - bufferMs));
}

export * from './metrics';
export * from './capacity';

