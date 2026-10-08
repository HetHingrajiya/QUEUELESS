import React from 'react';

export type SkeletonType = 'home' | 'office' | 'service' | 'queue' | 'notification' | 'history' | 'profile' | 'prediction';

interface SkeletonLoaderProps {
  type: SkeletonType;
  count?: number;
  className?: string;
}

export function SkeletonLoader({ type, count = 1, className = '' }: SkeletonLoaderProps) {
  const items = Array.from({ length: count });

  if (type === 'home') {
    return (
      <div className={`space-y-6 animate-pulse ${className}`}>
        {/* Header Skeleton */}
        <div className="flex items-center justify-between p-4 bg-slate-100 rounded-2xl">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-6 w-48 bg-slate-300 rounded" />
          </div>
          <div className="h-10 w-10 bg-slate-200 rounded-full" />
        </div>

        {/* Active Token Card Skeleton */}
        <div className="h-44 bg-slate-200 rounded-2xl" />

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
        </div>

        {/* Nearby Offices */}
        <div className="space-y-3">
          <div className="h-5 w-36 bg-slate-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-slate-100 rounded-2xl" />
            <div className="h-32 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'office') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-slate-200 rounded-full" />
            </div>
            <div className="flex gap-4 pt-2 border-t border-slate-100">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-4 w-24 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'service') {
    return (
      <div className={`space-y-3 animate-pulse ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'queue') {
    return (
      <div className={`p-6 bg-white border border-slate-200 rounded-2xl space-y-6 animate-pulse ${className}`}>
        <div className="flex justify-between items-center">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
        </div>
        <div className="h-28 bg-slate-100 rounded-xl flex items-center justify-center">
          <div className="h-12 w-32 bg-slate-200 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (type === 'notification') {
    return (
      <div className={`space-y-3 animate-pulse ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-start gap-4">
            <div className="h-10 w-10 bg-slate-200 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
              <div className="h-3 w-full bg-slate-100 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'history') {
    return (
      <div className={`space-y-3 animate-pulse ${className}`}>
        {items.map((_, i) => (
          <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-12 bg-slate-200 rounded-lg" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-24 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="h-6 w-20 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className={`space-y-6 animate-pulse ${className}`}>
        <div className="p-6 bg-white border border-slate-200 rounded-2xl flex items-center gap-4">
          <div className="h-16 w-16 bg-slate-200 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-56 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'prediction') {
    return (
      <div className={`p-6 bg-white border border-slate-200 rounded-2xl space-y-6 animate-pulse ${className}`}>
        <div className="space-y-2">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />;
}
