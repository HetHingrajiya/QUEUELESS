"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronRight, MapPin, Clock, Smartphone } from 'lucide-react';
import Link from 'next/link';

const slides = [
  {
    title: "Skip the Waiting Room",
    description: "Book your token from anywhere and only arrive when it's your turn.",
    icon: <Clock className="w-24 h-24 text-blue-500 mb-8" />,
    color: "bg-blue-50"
  },
  {
    title: "Find Nearby Offices",
    description: "Easily locate government offices and check live queue status before visiting.",
    icon: <MapPin className="w-24 h-24 text-emerald-500 mb-8" />,
    color: "bg-emerald-50"
  },
  {
    title: "Live Updates",
    description: "Get real-time notifications about your queue position right on your phone.",
    icon: <Smartphone className="w-24 h-24 text-purple-500 mb-8" />,
    color: "bg-purple-50"
  }
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(curr => curr + 1);
    } else {
      router.push('/login');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${slides[currentSlide].color}`}>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
          {slides[currentSlide].icon}
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4">{slides[currentSlide].title}</h1>
          <p className="text-lg text-slate-600 max-w-sm">{slides[currentSlide].description}</p>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-8 pb-12 flex flex-col items-center">
        {/* Pagination Dots */}
        <div className="flex space-x-2 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`}
            />
          ))}
        </div>

        <div className="w-full max-w-sm space-y-4">
          <Button 
            className="w-full h-14 text-lg rounded-xl flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200" 
            onClick={handleNext}
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            {currentSlide !== slides.length - 1 && <ChevronRight className="ml-2 w-5 h-5" />}
          </Button>

          {currentSlide === slides.length - 1 && (
            <div className="text-center mt-6 text-sm text-slate-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 font-semibold hover:underline">
                Register here
              </Link>
            </div>
          )}
          
          {currentSlide !== slides.length - 1 && (
            <button 
              onClick={() => router.push('/login')}
              className="w-full py-4 text-slate-500 font-medium hover:text-slate-800 transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
