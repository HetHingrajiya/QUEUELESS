"use client";
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MessageSquare, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function CitizenFeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call for MVP
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 max-w-lg mx-auto">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h2>
        <p className="text-slate-500 mb-8">Your feedback has been submitted successfully. We appreciate your input to help us improve.</p>
        <Button onClick={() => window.location.href = '/citizen/home'} className="w-full">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-lg mx-auto">
      <div className="flex flex-col space-y-2 mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800">Feedback</h2>
        <p className="text-slate-500">We'd love to hear about your experience.</p>
      </div>

      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-blue-600 h-2"></div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="text-center space-y-3">
              <Label className="text-base font-bold text-slate-700">How was your overall experience?</Label>
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
                      size={40} 
                      className={`${(hoverRating || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} transition-colors`} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                {rating === 1 && "Terrible"}
                {rating === 2 && "Poor"}
                {rating === 3 && "Average"}
                {rating === 4 && "Good"}
                {rating === 5 && "Excellent!"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="font-semibold text-slate-700 flex items-center">
                <MessageSquare size={16} className="mr-2 text-slate-400" />
                Tell us more (Optional)
              </Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What did you like or dislike?"
                className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              ></textarea>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700"
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                <><Loader2 className="animate-spin mr-2" /> Submitting...</>
              ) : (
                <><Send size={18} className="mr-2" /> Submit Feedback</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
