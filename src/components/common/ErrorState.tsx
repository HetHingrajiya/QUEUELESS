import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/** Consistent recoverable error state. Keep retry optional when an action is not safe. */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this information. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  className = '',
}: ErrorStateProps) {
  return (
    <section role="alert" className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-white p-8 text-center ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
        <AlertCircle size={24} aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          <RefreshCw size={15} className="mr-2" />{retryLabel}
        </Button>
      )}
    </section>
  );
}
