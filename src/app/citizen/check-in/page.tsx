"use client";
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, QrCode, ScanLine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CheckIn() {
  const [tokenInput, setTokenInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center mb-6">
        <Link href="/citizen/home" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Check In</h1>
      </div>

      <p className="text-slate-600">
        You've arrived! Please check in to let the counter know you are here.
      </p>

      {isScanning ? (
        <Card className="border-slate-200 overflow-hidden bg-slate-900">
          <CardContent className="p-0 h-64 flex flex-col items-center justify-center relative">
            <ScanLine size={64} className="text-blue-400 animate-pulse mb-4" />
            <p className="text-white text-sm font-medium">Scanning Office QR Code...</p>
            
            <Button 
              variant="outline" 
              className="absolute bottom-4 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => setIsScanning(false)}
            >
              Cancel Scan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-blue-200 shadow-blue-50 bg-blue-50/30">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <QrCode size={32} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Scan Office QR</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-[200px]">
              Scan the QR code displayed at the RTO office reception or counter.
            </p>
            <Button 
              onClick={() => setIsScanning(true)}
              className="bg-blue-600 hover:bg-blue-700 w-full max-w-[200px]"
            >
              <ScanLine size={18} className="mr-2" />
              Scan QR Code
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm font-medium">
          <span className="bg-slate-50 px-4 text-slate-500 uppercase tracking-widest text-xs">Or</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Manual Check-In</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-slate-700 mb-1">
                Enter your Token Number
              </label>
              <Input
                id="token"
                placeholder="e.g. A-145"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="h-12 uppercase"
              />
            </div>
            <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800" disabled={!tokenInput}>
              Verify & Check In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
