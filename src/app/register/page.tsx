"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Lock, Mail, User, Phone, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtp && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtp, resendTimer]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        // Show OTP step
        setRegisteredEmail(data.email);
        setShowOtp(true);
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail, otp }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        router.push('/citizen/home');
      } else {
        setError(result.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const result = await res.json();
      if (result.success) {
        setResendTimer(30); // reset timer
      } else {
        setError(result.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('An error occurred while resending OTP.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:grid lg:grid-cols-2 bg-background relative">
      
      {/* Theme Toggle Button */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute top-4 right-4 z-50 p-3 rounded-full bg-background/80 backdrop-blur-md shadow-neu border border-border text-foreground hover:text-primary transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      )}

      {/* Left Side: Image Journey */}
      <div className="hidden lg:flex relative w-full h-full bg-background overflow-hidden z-0">
         <Image 
                 src="/assets/Samay Setu City Services Journey.png" 
                 alt="Samay Setu City Services Journey" 
                 fill
                 priority
                 className="object-cover object-bottom"
               />
      </div>

      {/* Right Side: Register Form */}
      <div className="relative z-10 flex flex-col py-8 px-4 sm:px-6 lg:px-12 w-full lg:h-full lg:overflow-y-auto scrollbar-hide">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg z-10 relative my-auto">
          <div className="bg-background py-10 px-6 shadow-neu sm:rounded-3xl sm:px-12 border-0">
            
            <div className="flex flex-col items-center mb-10">
              <Image src="/assets/logo.png" alt="SamaySetu Logo" width={80} height={80} className="object-contain drop-shadow-md mb-4 block lg:hidden" />
              <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {showOtp ? 'Verify OTP' : 'Create an Account'}
              </h2>
              <p className="mt-3 text-center text-sm sm:text-base text-muted-foreground font-semibold">
                {showOtp ? 'Enter the code sent to your email.' : 'Join SamaySetu and save your valuable time.'}
              </p>
            </div>

            {showOtp ? (
              <form className="space-y-8" onSubmit={handleVerifyOtp}>
                {error && (
                  <div className="bg-background shadow-neu-inset text-destructive font-semibold px-4 py-3 rounded-xl text-sm text-center">
                    {error}
                  </div>
                )}
                
                <div className="text-center text-muted-foreground mb-6 font-medium">
                  We've sent a 6-digit OTP to <br />
                  <span className="font-bold text-foreground text-lg">{registeredEmail}</span>
                </div>
                
                <div>
                  <Label htmlFor="otp" className="text-muted-foreground font-semibold ml-2 text-base">6-Digit Code</Label>
                  <div className="mt-3 relative rounded-2xl">
                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      className="h-16 text-center text-3xl tracking-[0.5em] sm:tracking-[0.8em] font-extrabold rounded-2xl bg-background shadow-neu-inset"
                      placeholder="••••••"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl" disabled={isLoading || otp.length !== 6}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>
                </div>
                
                <div className="mt-6 flex flex-col items-center space-y-4">
                  <p className="text-sm text-muted-foreground font-medium">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || isResending}
                      className={`font-bold transition-colors ${resendTimer > 0 ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-primary hover:text-primary/80'}`}
                    >
                      {isResending ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </p>
                  <button type="button" onClick={() => setShowOtp(false)} className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors underline underline-offset-4">
                    Change Email Address
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }}>
                {error && (
                  <div className="bg-background shadow-neu-inset text-destructive font-semibold px-4 py-3 rounded-xl text-sm text-center">
                    {error}
                  </div>
                )}

                {/* Full Name Input */}
              <div>
                <Label htmlFor="fullName" className="text-muted-foreground font-semibold ml-2 text-base">Full Name</Label>
                <div className="mt-3 relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <Input
                    id="fullName"
                    {...register('fullName')}
                    className="pl-12 h-14 text-base rounded-xl"
                    placeholder="John Doe"
                  />
                </div>
                {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName.message}</p>}
              </div>
              
              {/* Email Input */}
              <div>
                <Label htmlFor="email" className="text-muted-foreground font-semibold ml-2 text-base">Email address</Label>
                <div className="mt-3 relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="pl-12 h-14 text-base rounded-xl"
                    placeholder="john@samaysetu.demo"
                  />
                </div>
                {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              {/* Phone Input */}
              <div>
                <Label htmlFor="phone" className="text-muted-foreground font-semibold ml-2 text-base">Phone Number</Label>
                <div className="mt-3 relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="pl-12 h-14 text-base rounded-xl"
                    placeholder="+91 9876543210"
                  />
                </div>
                {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>}
              </div>

              {/* Password Input */}
              <div>
                <Label htmlFor="password" className="text-muted-foreground font-semibold ml-2 text-base">Password</Label>
                <div className="mt-3 relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    className="pl-12 h-14 text-base rounded-xl"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-base text-muted-foreground font-medium">
                  Already have an account?{' '}
                  <Link href="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
