"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, QrCode, ScanLine, CheckCircle2, 
  MapPin, AlertCircle, Building2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CitizenToken, ApiResponse, CitizenQueueSummary } from '@/types/citizen';

export default function CheckIn() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState('');
  const [activeToken, setActiveToken] = useState<CitizenToken | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user already has an active token to prefill
    fetch('/api/citizen/queue')
      .then(r => r.json() as Promise<ApiResponse<CitizenQueueSummary>>)
      .then(res => {
        if (res.success && res.data?.token) {
          setActiveToken(res.data.token);
          setTokenInput(res.data.token.tokenNumber || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleCheckIn = async (tokenIdToUse?: string) => {
    try {
      setSubmitting(true);
      setError(null);

      // Get user location for geofence validation if available
      let userLat: number | undefined;
      let userLng: number | undefined;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          userLat = pos.coords.latitude;
          userLng = pos.coords.longitude;
        } catch {
          // Continue even if GPS timed out
        }
      }

      const res = await fetch('/api/citizen/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: tokenIdToUse || activeToken?._id,
          tokenNumber: !tokenIdToUse ? tokenInput.trim().toUpperCase() : undefined,
          userLat,
          userLng
        })
      });

      const json = await res.json();
      if (json.success) {
        const checkedTokenId = json.data?.tokenId || activeToken?._id || '';
        router.push(`/citizen/check-in/success?tokenId=${checkedTokenId}`);
      } else {
        setError(json.message || 'Check-in validation failed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error during check-in');
    } finally {
      setSubmitting(false);
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/home" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Screen 24 • Check-In
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Venue Check-In</h1>
          </div>
        </div>
      </div>

      <p className="text-slate-600 text-xs">
        Confirm your physical arrival at the office reception to signal the counter officers that you are present in the waiting hall.
      </p>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Token One-Tap Check-In */}
      {activeToken && (
        <Card className="border-blue-200 bg-blue-50/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-600">Active Token Detected</p>
              <h3 className="font-black text-slate-900 text-lg">{activeToken.tokenNumber}</h3>
              <p className="text-xs text-slate-500">{activeToken.serviceName}</p>
            </div>
            <Button
              onClick={() => handleCheckIn(activeToken._id)}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-4 shadow-sm"
            >
              {submitting ? 'Checking In...' : 'Check In Now'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Scanner Simulation */}
      {isScanning ? (
        <Card className="border-slate-200 overflow-hidden bg-slate-900 shadow-md">
          <CardContent className="p-0 h-64 flex flex-col items-center justify-center relative">
            <ScanLine size={64} className="text-blue-400 animate-pulse mb-3" />
            <p className="text-white text-xs font-semibold">Simulating QR Scan at Office Kiosk...</p>
            <p className="text-slate-400 text-[10px] mt-1">Verifying venue geofence & terminal signature</p>
            
            <div className="flex gap-2 mt-4">
              <Button 
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                onClick={() => handleCheckIn()}
                disabled={submitting}
              >
                Simulate Kiosk Scanned
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                onClick={() => setIsScanning(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
              <QrCode size={28} />
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Scan Office Reception QR</h2>
            <p className="text-xs text-slate-500 mb-5 max-w-xs">
              Point your camera at the kiosk or counter QR code displayed in the waiting lobby.
            </p>
            <Button 
              onClick={() => setIsScanning(true)}
              className="bg-blue-600 hover:bg-blue-700 w-full max-w-[220px] text-xs font-bold h-11"
            >
              <ScanLine size={16} className="mr-2" />
              Open Camera Scanner
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manual Check-In Option */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Manual Token Verification</h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="token" className="block text-xs font-semibold text-slate-600 mb-1">
                Enter your Token Number
              </label>
              <Input
                id="token"
                placeholder="Enter token number"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="h-11 uppercase text-sm font-bold tracking-wider"
              />
            </div>
            <Button 
              onClick={() => handleCheckIn()}
              disabled={submitting || !tokenInput.trim()}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-xs font-bold"
            >
              {submitting ? 'Verifying with Reception...' : 'Verify & Confirm Arrival'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
