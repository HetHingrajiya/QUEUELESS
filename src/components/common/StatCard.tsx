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
    <Card className={`border-0 bg-background shadow-neu rounded-2xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-neu-hover ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-neu-inset">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mt-2">{value}</div>
        {description && <p className="mt-2 text-xs font-semibold text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
