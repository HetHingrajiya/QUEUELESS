"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Star, ThumbsUp, Send, CheckCircle2, 
  MessageSquare, ShieldCheck, HeartHandshake 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ServiceRatingPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  const [ratings, setRatings] = useState({
    courtesy: 5,
    accuracy: 4,
    cleanliness: 5,
    overall: 5
  });
  const [comment, setComment] = useState('');

  const handleStarClick = (category: keyof typeof ratings, star: number) => {
    setRatings(prev => ({ ...prev, [category]: star }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="space-y-6 pb-20 max-w-md mx-auto pt-10 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 size={48} />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Screen 47 • Feedback Recorded
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Thank You for Your Rating!</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Your evaluation has been sent directly to the RTO administrative quality team.
          </p>
        </div>

        <div className="space-y-2 pt-4">
          <Link href="/citizen/feedback/history" className="block w-full">
            <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-xs font-bold">
              View Feedback History
            </Button>
          </Link>
          <Link href="/citizen/home" className="block w-full">
            <Button variant="ghost" className="w-full text-xs text-slate-500">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-md mx-auto pt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/citizen/feedback" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Screen 47 • Feedback
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Rate Your Service</h1>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="mb-4 text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400">TOKEN A-145</p>
            <h3 className="font-bold text-slate-900 text-base">Driving Licence Renewal</h3>
            <p className="text-xs text-slate-500">Officer Rajesh Sharma • Counter 4</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Criteria 1 */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Officer Courtesy</p>
                <p className="text-[11px] text-slate-400">Politeness & clarity</p>
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStarClick('courtesy', s)}
                    className="p-1"
                  >
                    <Star
                      size={20}
                      className={ratings.courtesy >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Criteria 2 */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Wait Time Accuracy</p>
                <p className="text-[11px] text-slate-400">AI prediction match</p>
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStarClick('accuracy', s)}
                    className="p-1"
                  >
                    <Star
                      size={20}
                      className={ratings.accuracy >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Criteria 3 */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Office Cleanliness</p>
                <p className="text-[11px] text-slate-400">Waiting hall comfort</p>
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStarClick('cleanliness', s)}
                    className="p-1"
                  >
                    <Star
                      size={20}
                      className={ratings.cleanliness >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div>
              <Label className="text-xs text-slate-600 mb-1 block">Officer Remarks or Compliments</Label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share any special feedback about your experience today..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-xs font-bold"
            >
              <Send size={14} className="mr-2" /> Submit Rating & Review
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
