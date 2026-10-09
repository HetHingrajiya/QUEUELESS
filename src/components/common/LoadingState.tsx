import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/** Consistent accessible loading indicator for pages and data panels. */
export function LoadingState({ label = 'Loading…', className = '', size = 'md' }: LoadingStateProps) {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 36 : 28;
  return (
    <div role="status" aria-live="polite" className={`flex min-h-[160px] flex-col items-center justify-center gap-3 text-slate-500 ${className}`}>
      <Loader2 size={iconSize} aria-hidden="true" className="animate-spin text-blue-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
