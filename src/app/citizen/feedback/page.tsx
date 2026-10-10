"use client";

import { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle2, Building2, Send, History } from 'lucide-react';
import Link from 'next/link';
import { CitizenOffice, ApiResponse } from '@/types/citizen';

export default function CitizenFeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [offices, setOffices] = useState<CitizenOffice[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load offices for selection
    const fetchOffices = async () => {
      try {
        const res = await fetch('/api/citizen/offices');
        const json: ApiResponse<CitizenOffice[]> = await res.json();
        if (json.success && json.data && json.data.length > 0) {
          setOffices(json.data);
          setOfficeId(json.data[0]._id);
        }
      } catch (err: unknown) {
        console.error('Failed to load offices', err);
      }
    };
    fetchOffices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeId || rating === 0) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/citizen/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId,
          rating,
          comment
        })
      });
      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
      } else {
        setError(json.message || 'Failed to submit feedback');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-6xl mx-auto pt-8 flex items-center justify-center cursor-default">
        <div className="bg-background shadow-neu rounded-[3rem] p-12 text-center max-w-lg w-full border-0 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-background shadow-neu-inset text-emerald-500 flex items-center justify-center mb-8">
            <CheckCircle2 size={48} className="drop-shadow-sm" />
          </div>
          
          <h2 className="text-2xl font-black text-foreground tracking-tight mb-4">Feedback Recorded</h2>
          <p className="text-sm font-semibold text-muted-foreground leading-relaxed mb-10 px-4">
            Thank you! Your feedback has been securely registered in the public grievance & service audit ledger to help improve government efficiency.
          </p>

          <div className="flex flex-col gap-4 w-full">
            <Link href="/citizen/feedback/history" className="w-full">
              <button className="w-full h-14 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all">
                <History size={16} className="mr-3" /> View History
              </button>
            </Link>
            <Link href="/citizen/home" className="w-full">
              <button className="w-full h-14 bg-background shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-muted-foreground hover:text-foreground flex items-center justify-center transition-all">
                Return to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col space-y-2 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Citizen Feedback</h1>
        <p className="text-muted-foreground text-xs sm:text-sm font-semibold">Your ratings directly evaluate staff service quality and queue efficiency.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Column: Context / Instructions */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-10 text-center border-0">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Service Audit</p>
            
            <div className="w-32 h-32 rounded-full mx-auto bg-background shadow-neu-inset flex items-center justify-center mb-6 text-primary">
              <Star size={48} className="text-primary opacity-80" />
            </div>
            
            <h2 className="text-xl font-black text-foreground tracking-tight mb-8">Make Your Voice Heard</h2>
            
            <div className="bg-background shadow-neu-inset p-5 rounded-2xl border-2 border-primary/10 text-left">
              <MessageSquare size={24} className="text-primary mb-3" />
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                By submitting honest feedback, you contribute to public performance KPIs. The administrative officers review this data to reduce wait times and improve facility conditions.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Feedback Form */}
        <div className="lg:col-span-8">
          <div className="bg-background shadow-neu rounded-[2.5rem] p-8 sm:p-10 border-0">
            
            {error && (
              <div className="p-4 mb-8 rounded-2xl bg-background shadow-neu-inset border-2 border-red-500/20 text-red-500 text-sm font-bold flex items-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Select Office */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Select Office</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                  <select
                    value={officeId}
                    onChange={(e) => setOfficeId(e.target.value)}
                    className="w-full h-14 pl-14 pr-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                    required
                  >
                    {offices.map((off) => (
                      <option key={off._id} value={off._id}>
                        {off.name} ({off.department || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rating Component */}
              <div className="bg-background shadow-neu-inset p-8 rounded-[2rem] text-center border-0">
                <label className="text-sm font-black text-foreground mb-6 block">How was your overall experience?</label>
                
                <div className="flex justify-center gap-2 sm:gap-4 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isActive 
                            ? 'bg-background shadow-neu-inset text-amber-500' 
                            : 'bg-background shadow-neu hover:shadow-neu-hover text-muted-foreground/30'
                        }`}
                      >
                        <Star 
                          size={24} 
                          className={`transition-colors ${isActive ? 'fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : ''}`} 
                        />
                      </button>
                    );
                  })}
                </div>
                
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest h-4">
                  {rating === 1 && "Poor Experience"}
                  {rating === 2 && "Below Average"}
                  {rating === 3 && "Average"}
                  {rating === 4 && "Good Experience"}
                  {rating === 5 && "Excellent Service!"}
                </p>
              </div>

              {/* Comment Box */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-4">Comments & Suggestions (Optional)</label>
                <div className="relative">
                  <MessageSquare size={18} className="absolute left-5 top-5 text-primary pointer-events-none" />
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience regarding waiting time, staff courtesy, or facilities..."
                    className="w-full h-32 pl-14 pr-5 py-5 bg-background shadow-neu-inset rounded-2xl text-sm font-bold text-foreground placeholder:text-muted-foreground/50 border-0 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || rating === 0 || !officeId}
                  className="w-full h-16 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-sm uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center"><span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></span> Submitting...</span>
                  ) : (
                    <span className="flex items-center"><Send size={18} className="mr-3" /> Submit Feedback</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
