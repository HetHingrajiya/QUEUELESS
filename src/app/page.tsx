"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to full animated splash screen
    const timer = setTimeout(() => {
      router.push('/splash');
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      
      <div className="z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="bg-white p-4 rounded-2xl shadow-xl mb-6">
          <Layers size={64} className="text-blue-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">QueueLess</h1>
        <p className="text-blue-100 text-lg font-medium tracking-wide">Government Services</p>
      </div>
      
      <div className="absolute bottom-12 flex justify-center w-full z-10 animate-pulse">
        <div className="h-1.5 w-24 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-[progress_2s_ease-in-out]"></div>
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
