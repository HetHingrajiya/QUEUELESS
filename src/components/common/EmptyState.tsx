import React from 'react';

export interface EmptyStateProps {
  message: string;
  colSpan?: number;
  icon?: React.ReactNode;
}

export function EmptyState({ message, colSpan = 1, icon }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-slate-500">
        {icon && <div className="flex justify-center mb-2">{icon}</div>}
        {message}
      </td>
    </tr>
  );
}
