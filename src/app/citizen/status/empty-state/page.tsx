"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Inbox, Ticket, Search, Heart, 
  Clock, ArrowRight, ArrowLeft, PlusCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmptyStateShowcasePage() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'search' | 'favorites' | 'history'>('tokens');

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/home" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
<h1 className="text-xl font-bold text-slate-900 mt-0.5">Empty State Variations</h1>
          </div>
        </div>
      </div>

      {/* Variation Switcher Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { key: 'tokens' as const, label: 'No Active Tokens' },
          { key: 'search' as const, label: 'No Search Results' },
          { key: 'favorites' as const, label: 'No Saved Favorites' },
          { key: 'history' as const, label: 'No Past History' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render Active Empty State Showcase */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-10 text-center">
          {activeTab === 'tokens' && (
            <div className="space-y-3">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Active Tokens</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                You haven&apos;t joined any office queue today. Pick an office and generate a virtual token to skip physical lines.
              </p>
              <div className="pt-4">
                <Link href="/citizen/token">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-bold">
                    + Take a Virtual Token
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-3">
              <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Matching Results</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                We couldn&apos;t find any government offices or services matching your query. Check spelling or try nearby locations.
              </p>
              <div className="pt-4">
                <Link href="/citizen/offices">
                  <Button variant="outline" className="text-xs font-bold border-slate-300">
                    Browse All Offices
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-3">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Saved Offices</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Tap the heart icon on any government office to save it for 1-tap fast booking next time.
              </p>
              <div className="pt-4">
                <Link href="/citizen/offices">
                  <Button className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold">
                    Explore Nearby Offices
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No Past Visits Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Your past appointments, receipts, and completed tokens will appear here after your first queue visit.
              </p>
              <div className="pt-4">
                <Link href="/citizen/token">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-xs font-bold">
                    Book Your First Token
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
