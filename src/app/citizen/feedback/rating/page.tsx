"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Star, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CitizenOffice, ApiResponse } from '@/types/citizen';

function ServiceRatingContent() {
  const searchParams = useSearchParams();
  const tokenId = searchParams ? searchParams.get('tokenId') || '' : '';
  const officeIdParam = searchParams ? searchParams.get('officeId') || '' : '';

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [officeId, setOfficeId] = useState(officeIdParam);
  const [offices, setOffices] = useState<CitizenOffice[]>([]);

  const [ratings, setRatings] = useState({
    courtesy: 5,
    accuracy: 5,
    cleanliness: 5,
    overall: 5
  });
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!officeIdParam) {
      fetch('/api/citizen/offices')
        .then(r => r.json() as Promise<ApiResponse<CitizenOffice[]>>)
        .then(res => {
          if (res.success && res.data && res.data.length > 0) {
            setOffices(res.data);
            setOfficeId(res.data[0]._id);
          }
        })
        .catch(console.error);
    }
  }, [officeIdParam]);

  const handleStarClick = (category: keyof typeof ratings, star: number) => {
    setRatings(prev => ({ ...prev, [category]: star }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/citizen/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: tokenId || undefined,
          officeId: officeId || officeIdParam,
          rating: ratings.overall,
          courtesyRating: ratings.courtesy,
          waitAccuracyRating: ratings.accuracy,
          cleanlinessRating: ratings.cleanliness,
          comment
        })
      });
      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
      } else {
        setError(json.message || 'Failed to submit rating');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6 pb-20 max-w-md mx-auto pt-10 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 size={40} />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Screen 47 • Feedback Recorded
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Thank You for Your Rating!</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Your detailed service review has been submitted and forwarded to office quality assurance.
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

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-6">
          {!officeIdParam && offices.length > 0 && (
            <div className="mb-4">
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Office</Label>
              <select
                value={officeId}
                onChange={(e) => setOfficeId(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs text-slate-800"
              >
                {offices.map(o => (
                  <option key={o._id} value={o._id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Criteria 1: Courtesy */}
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
                      className={s <= ratings.courtesy ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Criteria 2: Wait Accuracy */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Wait Time Accuracy</p>
                <p className="text-[11px] text-slate-400">Punctuality vs prediction</p>
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
                      className={s <= ratings.accuracy ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Criteria 3: Cleanliness */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Premises & Cleanliness</p>
                <p className="text-[11px] text-slate-400">Waiting hall hygiene</p>
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
                      className={s <= ratings.cleanliness ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Overall Experience */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Overall Rating</p>
                <p className="text-[11px] text-slate-400">General satisfaction</p>
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStarClick('overall', s)}
                    className="p-1"
                  >
                    <Star
                      size={22}
                      className={s <= ratings.overall ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="font-bold text-slate-700">Detailed Review (Optional)</Label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share any specific notes for administrative review..."
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              {submitting ? 'Recording Rating...' : 'Submit Rating'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ServiceRatingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading rating form...</div>}>
      <ServiceRatingContent />
    </Suspense>
  );
}
