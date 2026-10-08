"use client";

import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function LoadingSkeletonShowcasePage() {
  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/home" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 57 • System UI
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Loading & Skeleton States</h1>
          </div>
        </div>
        <div className="flex items-center text-xs text-blue-600 font-semibold">
          <Loader2 size={16} className="animate-spin mr-1.5" /> Shimmer Active
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Showcase of high-fidelity animated shimmer placeholder cards used during live data fetches.
      </p>

      {/* 1. Token Hero Skeleton */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. Hero Live Token Skeleton</span>
        <Card className="border-slate-200 overflow-hidden shadow-sm">
          <div className="h-2 w-full bg-slate-200 animate-pulse"></div>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
                <div className="h-8 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-40 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="h-8 w-16 bg-slate-200 rounded-full animate-pulse" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
            </div>

            <div className="h-2 w-full bg-slate-200 rounded-full animate-pulse" />
          </CardContent>
        </Card>
      </div>

      {/* 2. Office Cards Skeleton */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">2. Office Card Skeletons</span>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 3. Spinner Overlay */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
        <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
        <p className="text-xs font-bold text-slate-700">Connecting to Realtime WebSocket Hub</p>
        <p className="text-[11px] text-slate-400">Subscribed to room: office-rto-rajkot-live</p>
      </div>
    </div>
  );
}
