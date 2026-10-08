import React from 'react';
import Link from 'next/link';

export interface EmptyStateProps {
  message?: string;
  title?: string;
  description?: string;
  colSpan?: number;
  icon?: React.ReactNode;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  message,
  title,
  description,
  colSpan,
  icon,
  actionText,
  actionHref,
  onAction,
  className = ''
}: EmptyStateProps) {
  // If used inside a <tbody> with colSpan
  if (colSpan !== undefined) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-6 py-12 text-center text-slate-500">
          {icon && <div className="flex justify-center mb-2">{icon}</div>}
          <p className="font-medium text-slate-700">{title || message}</p>
          {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
        </td>
      </tr>
    );
  }

  // Standard block empty state
  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title || message || 'No data found'}</h3>
      {(description || message) && (
        <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
          {description || (title ? message : 'There is nothing to display here at the moment.')}
        </p>
      )}
      {actionText && (
        <div>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm hover:shadow active:scale-95"
            >
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm hover:shadow active:scale-95"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
