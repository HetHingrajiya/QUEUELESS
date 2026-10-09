import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

/** Shared KPI card used across Admin and Super Admin dashboards. */
export function StatCard({ title, value, icon, description, className = '' }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </CardContent>
    </Card>
  );
}
