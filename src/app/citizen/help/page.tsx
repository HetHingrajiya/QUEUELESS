"use client";

import { 
  HelpCircle, Mail, Phone, MessageSquare, ChevronRight, 
  Info, WifiOff, AlertTriangle, ShieldAlert, Clock, Inbox, Loader2 
} from 'lucide-react';
import Link from 'next/link';

export default function CitizenHelpPage() {
  const faqs = [
    { q: "How do I book a virtual token?", a: "Find an office near you from the home page, select the specific service you need, and tap the 'Take Virtual Token' button to join the live queue." },
    { q: "What happens if I miss my turn?", a: "You are given a short grace period when called. After that, your token will be marked as 'No Show' and you'll need to generate a new token." },
    { q: "Can I cancel my token?", a: "Yes, you can cancel your token at any time from your Live Queue Tracker if you no longer plan to visit." }
  ];

  const diagnosticLinks = [
    { href: "/citizen/status/no-internet", icon: <WifiOff size={20} className="text-amber-500" />, label: "Offline Mode" },
    { href: "/citizen/status/server-error", icon: <AlertTriangle size={20} className="text-red-500" />, label: "500 Error" },
    { href: "/citizen/status/unauthorized", icon: <ShieldAlert size={20} className="text-indigo-500" />, label: "403 Denied" },
    { href: "/citizen/status/session-expired", icon: <Clock size={20} className="text-slate-500" />, label: "Expired" },
    { href: "/citizen/status/empty-state", icon: <Inbox size={20} className="text-emerald-500" />, label: "Empty Data" },
    { href: "/citizen/status/loading", icon: <Loader2 size={20} className="text-blue-500" />, label: "Loading State" },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Get assistance, view FAQs, or contact our support team.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Contact & Resources */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="grid grid-cols-2 gap-4">
            <Link href="/citizen/help/contact" className="block group">
              <div className="bg-background shadow-neu group-hover:shadow-neu-hover active:shadow-neu-inset rounded-[2rem] p-6 text-center transition-all h-full border-0">
                <div className="w-14 h-14 mx-auto rounded-full bg-background shadow-neu-inset flex items-center justify-center text-primary mb-4">
                  <MessageSquare size={24} />
                </div>
                <h3 className="font-black text-sm text-foreground mb-1">Help Desk</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Submit Ticket</p>
              </div>
            </Link>
            
            <Link href="/citizen/help/contact" className="block group">
              <div className="bg-background shadow-neu group-hover:shadow-neu-hover active:shadow-neu-inset rounded-[2rem] p-6 text-center transition-all h-full border-0">
                <div className="w-14 h-14 mx-auto rounded-full bg-background shadow-neu-inset flex items-center justify-center text-emerald-500 mb-4">
                  <Phone size={24} />
                </div>
                <h3 className="font-black text-sm text-foreground mb-1">Helpline</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Call Officer</p>
              </div>
            </Link>
          </div>

          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 border-0">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">Resources</h3>
            
            <div className="space-y-4">
              <Link href="/citizen/help/contact" className="flex items-center justify-between p-5 bg-background shadow-neu-inset hover:shadow-neu rounded-2xl transition-all group">
                <div className="flex items-center space-x-4">
                  <MessageSquare size={18} className="text-primary" />
                  <span className="text-sm font-extrabold text-foreground">Contact Support Desk</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              
              <Link href="/citizen/about" className="flex items-center justify-between p-5 bg-background shadow-neu-inset hover:shadow-neu rounded-2xl transition-all group">
                <div className="flex items-center space-x-4">
                  <Info size={18} className="text-indigo-500" />
                  <span className="text-sm font-extrabold text-foreground">About SamaySetu</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              
              <Link href="/citizen/feedback" className="flex items-center justify-between p-5 bg-background shadow-neu-inset hover:shadow-neu rounded-2xl transition-all group">
                <div className="flex items-center space-x-4">
                  <Mail size={18} className="text-emerald-500" />
                  <span className="text-sm font-extrabold text-foreground">Send Feedback</span>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </div>

        </div>

        {/* Right Column: FAQs & Diagnostics */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 sm:p-10 border-0">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Frequently Asked Questions</h3>
            
            <div className="space-y-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-background shadow-neu-inset p-6 sm:p-8 rounded-[2rem] border-0">
                  <h4 className="font-black text-base text-foreground flex items-start mb-3">
                    <HelpCircle size={20} className="text-primary mr-3 shrink-0 mt-0.5" />
                    {faq.q}
                  </h4>
                  <p className="text-sm font-semibold text-muted-foreground leading-relaxed pl-8">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 sm:p-10 border-0">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Developer Diagnostic Pages</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {diagnosticLinks.map((link, idx) => (
                <Link key={idx} href={link.href} className="block group">
                  <div className="bg-background shadow-neu-inset group-hover:shadow-neu rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all h-full gap-3">
                    {link.icon}
                    <span className="text-xs font-bold text-foreground">{link.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
