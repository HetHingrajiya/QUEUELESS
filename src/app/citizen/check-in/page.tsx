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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadToken = async () => {
      try {
        // Respect the token selected on the Live Queue page. Fall back to the latest active token only when no ID is supplied.
        const requestedTokenId = new URLSearchParams(window.location.search).get('tokenId');
        const url = requestedTokenId
          ? `/api/citizen/queue/${encodeURIComponent(requestedTokenId)}`
          : '/api/citizen/queue';
        const response = await fetch(url, { cache: 'no-store' });
        const result: ApiResponse<CitizenQueueSummary> = await response.json();
        if (cancelled) return;

        const token = result.success ? (result.data?.token || null) : null;
        setActiveToken(token);
        if (token?.tokenNumber) setTokenInput(token.tokenNumber);
        else if (requestedTokenId) setError(result.message || 'The selected token could not be loaded.');
      } catch {
        if (!cancelled) setError('Unable to load your token. Please refresh and try again.');
      }
    };

    void loadToken();
    return () => { cancelled = true; };
  }, []);

  const handleCheckIn = async (tokenIdToUse?: string) => {
    try {
      setSubmitting(true);
      setError(null);

      // Get user location for geofence validation
      let userLat: number | undefined;
      let userLng: number | undefined;

      if (typeof window !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
              timeout: 6000, 
              enableHighAccuracy: true 
            });
          });
          userLat = pos.coords.latitude;
          userLng = pos.coords.longitude;
        } catch (geoErr) {
          console.warn('Geolocation acquisition status:', geoErr);
        }
      }

      const res = await fetch('/api/citizen/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: tokenIdToUse || activeToken?._id,
          tokenNumber: !tokenIdToUse ? tokenInput.trim().toUpperCase() : undefined,
          lat: userLat,
          lon: userLng,
          userLat,
          userLng
        })
      });

      const json = await res.json();
      if (json.success) {
        const checkedTokenId = json.data?.tokenId || tokenIdToUse || activeToken?._id || '';
        router.push(`/citizen/check-in/success?tokenId=${checkedTokenId}`);
      } else {
        setError(json.message || 'Check-in validation failed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error during check-in');
    } finally {
      setSubmitting(false);
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

      {/* Honest status: this page currently supports token verification, not camera-based kiosk QR scanning. */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-4 flex items-start gap-3">
          <QrCode size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Check in with your token</h2>
            <p className="text-xs text-slate-500 mt-1">
              Use the active-token button or enter your token number below. Camera-based reception QR scanning is not enabled here, so this page will not simulate a scan.
            </p>
          </div>
        </CardContent>
      </Card>

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
