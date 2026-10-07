"use client";
import { useState, useEffect, use } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, MapPin, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LeaveTimePage({ params }: { params: Promise<{ tokenId: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const tokenId = unwrappedParams.tokenId;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaveTime = async () => {
      try {
        const res = await fetch(`/api/citizen/queue/${tokenId}/leave-time`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Failed to load leave time", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaveTime();
  }, [tokenId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto pt-4 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" className="mr-2 -ml-2 text-slate-500" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <MapPin className="text-indigo-600 mr-2" size={24} />
          When Should I Leave?
        </h2>
      </div>

      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-sm overflow-hidden">
        <div className="bg-indigo-600 h-1.5 w-full"></div>
        <CardContent className="p-12 text-center">
          {!data?.travelTimeAvailable ? (
            <div className="flex flex-col items-center">
              <AlertCircle size={48} className="text-slate-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Travel time unavailable</h3>
              <p className="text-sm text-slate-500">We cannot calculate your travel time right now because location services or routing providers are currently unavailable.</p>
            </div>
          ) : (
            <div>
              {/* Future Implementation for real travel time */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
