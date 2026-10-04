import Link from 'next/link';
import { CheckCircle2, QrCode, ArrowRight, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TokenConfirmation() {
  return (
    <div className="space-y-6 pb-12 flex flex-col items-center pt-8">
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
        <CheckCircle2 size={40} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Token Confirmed</h1>
      <p className="text-slate-500 mb-8">Your virtual token has been generated</p>

      <Card className="w-full max-w-sm border-blue-200 shadow-blue-50 overflow-hidden relative">
        <div className="bg-blue-600 h-4 absolute top-0 left-0 right-0"></div>
        <CardContent className="p-8 text-center pt-10">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Token Number</p>
          <p className="text-6xl font-black text-slate-900 tracking-tighter mb-8">A-145</p>
          
          <div className="space-y-4 mb-8">
            <div className="flex flex-col text-sm border-b border-slate-100 pb-4">
              <span className="text-slate-500 mb-1">Service</span>
              <span className="font-semibold text-slate-900 text-base">Driving Licence</span>
            </div>
            <div className="flex flex-col text-sm border-b border-slate-100 pb-4">
              <span className="text-slate-500 mb-1">Office</span>
              <span className="font-semibold text-slate-900 text-base">RTO Rajkot</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-center mb-8 border border-slate-100">
            <QrCode size={120} className="text-slate-800" />
          </div>
          <p className="text-xs text-slate-400">Scan at the office kiosk to check in</p>
        </CardContent>
      </Card>

      <div className="w-full max-w-sm grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">People Ahead</p>
          <p className="font-bold text-xl text-slate-900">18</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 mb-1">Est. Wait</p>
          <p className="font-bold text-xl text-slate-900">32 min</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-blue-50 border border-blue-100 rounded-xl p-4 text-center mt-4">
        <div className="flex items-center justify-center text-blue-600 mb-1">
          <Clock size={16} className="mr-2" />
          <span className="text-sm font-semibold">Recommended Arrival</span>
        </div>
        <p className="font-bold text-xl text-blue-900">10:42 AM</p>
      </div>

      <div className="w-full max-w-sm mt-8 space-y-3">
        <Link href="/citizen/queue" className="block w-full">
          <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800">
            Track Live Queue <ArrowRight size={18} className="ml-2" />
          </Button>
        </Link>
        <Link href="/citizen/home" className="block w-full">
          <Button variant="ghost" className="w-full h-12 text-slate-500">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
