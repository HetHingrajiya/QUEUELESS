"use client";

import Link from 'next/link';
import { 
  ShieldAlert, Lock, ArrowRight, UserCheck, 
  LogIn, UserPlus, HelpCircle 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UnauthorizedStatusPage() {
  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-8 text-center">
      {/* Lock Graphic */}
      <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-lg ring-8 ring-amber-400/20">
        <Lock size={48} className="text-amber-600" />
      </div>

      <div>
<h1 className="text-2xl font-black text-slate-900 mt-2">Authentication Required</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          You must be signed in with a verified citizen account to access this queue record or booking module.
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 text-left space-y-1.5">
        <p className="font-bold text-slate-800 flex items-center">
          <ShieldAlert size={15} className="mr-1.5 text-blue-600 shrink-0" />
          Security Verification Notice
        </p>
        <p className="text-[11px] leading-relaxed">
          Government service tokens require active citizen identity validation to prevent unauthorized queue alterations or duplicate token claims.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <Link href="/login" className="block w-full">
          <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
            <LogIn size={16} className="mr-2" /> Sign In to Citizen Account
          </Button>
        </Link>
        <Link href="/register" className="block w-full">
          <Button variant="outline" className="w-full h-12 text-xs font-semibold border-slate-300">
            <UserPlus size={16} className="mr-2" /> Create New Citizen Account
          </Button>
        </Link>
        <Link href="/citizen/home" className="block w-full">
          <Button variant="ghost" className="w-full text-xs text-slate-500">
            Browse Public Offices as Guest
          </Button>
        </Link>
      </div>
    </div>
  );
}
