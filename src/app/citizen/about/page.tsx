"use client";

import Link from 'next/link';
import { 
  ArrowLeft, Layers, ShieldCheck, 
  Sparkles, CheckCircle2,
  Smartphone, Bot, Map, QrCode
} from 'lucide-react';

export default function AboutSamaySetuPage() {
  const features = [
    { 
      title: "Virtual Token Booking", 
      desc: "Book queue slots remotely from anywhere without standing in physical lines.",
      icon: <Smartphone size={20} className="text-primary" />
    },
    { 
      title: "AI-Powered Wait Estimation", 
      desc: "Machine learning models dynamically calculate wait time using live teller velocity.",
      icon: <Bot size={20} className="text-indigo-500" />
    },
    { 
      title: "Smart Mobility Alerts", 
      desc: "Know the exact minute to leave home or office to arrive right when called.",
      icon: <Map size={20} className="text-amber-500" />
    },
    { 
      title: "Zero Paper Digital Pass", 
      desc: "Secure encrypted QR codes with automated kiosk and geofence check-ins.",
      icon: <QrCode size={20} className="text-emerald-500" />
    }
  ];

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex items-center mb-8 px-4 sm:px-6 lg:px-8">
        <Link href="/citizen/help">
          <button className="w-12 h-12 mr-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full transition-all text-muted-foreground hover:text-foreground shrink-0 border-0">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">About SamaySetu</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold">The platform powering smart queueing.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 px-4 sm:px-6 lg:px-8">
        
        {/* Left Column: Brand Hero */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0 flex flex-col items-center justify-center min-h-[400px]">
            
            <div className="w-28 h-28 bg-background shadow-neu-inset rounded-[2rem] flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-xl" />
              <Layers size={48} className="text-primary relative z-10" />
            </div>
            
            <h2 className="text-3xl font-black text-foreground tracking-tight mb-2">SamaySetu</h2>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-background shadow-neu text-xs font-black uppercase tracking-widest text-primary mb-8 border-0">
              <span className="w-2 h-2 rounded-full bg-primary" /> Version 2.4.0
            </div>
            
            <p className="text-sm font-semibold text-muted-foreground leading-relaxed max-w-xs">
              The next-generation civic queue management platform transforming citizen engagement across public offices.
            </p>
          </div>
        </div>

        {/* Right Column: Features & Compliance */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 sm:p-10 border-0">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center mb-8">
              <Sparkles size={14} className="text-primary mr-2" />
              Core Technological Innovations
            </h3>

            <div className="space-y-4">
              {features.map((item, idx) => (
                <div key={idx} className="bg-background shadow-neu-inset hover:shadow-neu transition-all p-6 rounded-3xl flex items-start gap-5 border-0 group">
                  <div className="w-12 h-12 rounded-xl bg-background shadow-neu flex items-center justify-center shrink-0 transition-transform group-hover:-translate-y-1">
                    {item.icon}
                  </div>
                  <div className="pt-1">
                    <h4 className="font-black text-base text-foreground mb-1">{item.title}</h4>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 border-0 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left transition-all hover:shadow-neu-hover">
            <div className="w-16 h-16 rounded-full bg-background shadow-neu-inset flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h4 className="font-black text-lg text-foreground mb-2">GovTech Compliance & Data Privacy</h4>
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                All token transactions and citizen identifiers are secured via 256-bit AES encryption and strictly adhere to national digital personal data protection standards.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground pt-4">
            <span>© 2026 SamaySetu GovTech</span>
            <span className="hidden sm:inline">•</span>
            <Link href="/citizen/help" className="hover:text-primary transition-colors bg-background shadow-neu px-4 py-2 rounded-full">Help & FAQs</Link>
            <Link href="/citizen/settings/privacy" className="hover:text-primary transition-colors bg-background shadow-neu px-4 py-2 rounded-full">Privacy Policy</Link>
          </div>

        </div>

      </div>
    </div>
  );
}
