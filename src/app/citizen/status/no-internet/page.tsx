"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  WifiOff, RefreshCw, QrCode, ArrowRight, 
  Smartphone, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NoInternetStatusPage() {
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const checkConnection = () => {
    setChecking(true);
    setStatusMsg('');
    setTimeout(() => {
      setChecking(false);
      setStatusMsg(navigator.onLine ? "Connection restored! You are back online." : "Still offline. Please check your Wi-Fi or cellular data.");
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-8 text-center">
      {/* Offline Graphic */}
      <div className="w-24 h-24 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto shadow-md ring-8 ring-slate-200/50">
        <WifiOff size={48} className="text-slate-600" />
      </div>

      <div>
<h1 className="text-2xl font-black text-slate-900 mt-2">No Internet Connection</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          We can&apos;t connect to QueueLess cloud servers right now. Check your mobile network or Wi-Fi connection.
        </p>
      </div>

      {/* Offline Token Pass Cache */}
      <Card className="border-slate-200 bg-white text-left shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <QrCode size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Offline Pass Available</p>
              <p className="text-[11px] text-slate-400">Your latest token is saved locally on your device</p>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-800">Token A-145</span>
              <p className="text-[11px] text-slate-500">RTO Rajkot • Driving Licence</p>
            </div>
            <Link href="/citizen/queue/qr">
              <Button size="sm" variant="outline" className="text-xs">
                View Cached Pass
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs font-semibold ${statusMsg.includes('restored') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {statusMsg}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-2">
        <Button
          onClick={checkConnection}
          disabled={checking}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md"
        >
          {checking ? (
            <>
              <RefreshCw size={16} className="animate-spin mr-2" /> Testing Connection...
            </>
          ) : (
            'Try Reconnecting'
          )}
        </Button>
        <Link href="/citizen/home" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Open App in Offline Mode
          </Button>
        </Link>
      </div>
    </div>
  );
}
