import React from 'react';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getStatusColor = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'ACTIVE':
      case 'COMPLETED':
      case 'SERVING':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PAUSED':
      case 'WAITING':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'MAINTENANCE':
      case 'NO_SHOW':
      case 'INACTIVE':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'OFFLINE':
      case 'SKIPPED':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)} ${className}`}>
      {status ? status.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
}
