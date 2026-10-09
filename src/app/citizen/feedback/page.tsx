"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MessageSquare, CheckCircle2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
      <div className="flex flex-col items-center justify-center py-16 text-center px-4 max-w-lg mx-auto">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-5 text-emerald-600 shadow-sm">
          <CheckCircle2 size={36} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mb-2">
          Feedback Submitted Successfully
        </span>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-sm">
          Your feedback has been recorded in the public grievance & service audit ledger.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link href="/citizen/feedback/history" className="flex-1">
            <Button variant="outline" className="w-full">View Feedback History</Button>
          </Link>
          <Link href="/citizen/home" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Citizen Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-lg mx-auto pt-2">
      <div className="flex flex-col space-y-1">
<h1 className="text-2xl font-extrabold text-slate-900">Provide Feedback</h1>
        <p className="text-slate-500 text-sm">Your ratings directly evaluate staff service quality and queue efficiency.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          {error}
        </div>
      )}

      <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="bg-blue-600 h-1.5" />
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Select Office */}
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700 text-xs flex items-center">
                <Building2 size={14} className="mr-1.5 text-slate-400" /> Select Office
              </Label>
              <select
                value={officeId}
                onChange={(e) => setOfficeId(e.target.value)}
                className="w-full h-11 px-3 border border-slate-200 rounded-xl bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {offices.map((off) => (
                  <option key={off._id} value={off._id}>
                    {off.name} ({off.department || 'General'})
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Stars */}
            <div className="text-center space-y-2 pt-2">
              <Label className="text-sm font-bold text-slate-700">How was your overall experience?</Label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110 p-1"
                  >
                    <Star 
                      size={36} 
                      className={`${(hoverRating || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} transition-colors`} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {rating === 1 && "1 Star - Poor"}
                {rating === 2 && "2 Stars - Fair"}
                {rating === 3 && "3 Stars - Good"}
                {rating === 4 && "4 Stars - Very Good"}
                {rating === 5 && "5 Stars - Excellent!"}
              </p>
            </div>

            {/* Message input */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="font-semibold text-slate-700 text-xs flex items-center">
                <MessageSquare size={14} className="mr-1.5 text-slate-400" />
                Comments / Suggestions (Optional)
              </Label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience regarding waiting time, staff courtesy, or facilities..."
                className="w-full h-28 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-xs"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-sm font-bold bg-blue-600 hover:bg-blue-700"
              disabled={submitting || rating === 0 || !officeId}
            >
              {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
