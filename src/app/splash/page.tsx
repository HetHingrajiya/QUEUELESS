"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/onboarding');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 flex flex-col items-center justify-center relative overflow-hidden text-white px-4">
      {/* Background Decorative Rings */}
      <div className="absolute top-[-15%] left-[-15%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-sm text-center">
        <div className="bg-white p-5 rounded-3xl shadow-2xl mb-6 ring-8 ring-white/10">
          <Layers size={64} className="text-blue-600" />
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">QueueLess</h1>
        <p className="text-blue-200 text-base font-medium mb-8">
          Smart Queue Management for Public Services
        </p>

        <div className="flex items-center space-x-2 text-xs text-blue-200/80 mb-8 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>Government Digital Initiative</span>
        </div>

        {/* Skip button if user doesn't want to wait */}
        <div className="space-y-3 w-full">
          <Link
            href="/onboarding"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl shadow-lg hover:bg-blue-50 transition-all text-sm"
          >
            Continue to Onboarding <ArrowRight size={16} className="ml-2" />
          </Link>
          <Link
            href="/citizen/home"
            className="w-full inline-flex items-center justify-center px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl border border-white/15 transition-all text-xs"
          >
            Skip Directly to Citizen Home
          </Link>
        </div>
      </div>

      {/* Loading Progress Line */}
      <div className="absolute bottom-8 flex flex-col items-center space-y-2 z-10">
        <p className="text-[11px] text-blue-200/60 uppercase tracking-widest font-semibold">Loading Environment</p>
        <div className="h-1.5 w-32 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-[progress_2.5s_ease-in-out]"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
