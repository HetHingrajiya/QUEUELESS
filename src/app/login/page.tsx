"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Lock, Mail, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Forgot Password State
  const [view, setView] = useState<'login' | 'forgot' | 'forgot-otp' | 'reset'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === 'forgot-otp' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [view, resendTimer]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (result.success) {
        const role = result.data.user.role;
        if (role === 'SUPER_ADMIN') router.push('/super-admin/dashboard');
        else if (role === 'ADMIN') router.push('/admin/dashboard');
        else if (role === 'STAFF') router.push('/staff/dashboard');
        else if (role === 'CITIZEN') router.push('/citizen/home');
        else router.push('/');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const result = await res.json();
      if (result.success) {
        setView('forgot-otp');
        setResendTimer(30);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetOtp }),
      });
      const result = await res.json();
      if (result.success) {
        setResetToken(result.data.resetToken);
        setView('reset');
      } else {
        setError(result.message || 'Invalid OTP');
      }
    } catch (err) {
      setError('Failed to verify OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, resetToken, newPassword }),
      });
      const result = await res.json();
      if (result.success) {
        const role = result.data.user.role;
        if (role === 'SUPER_ADMIN') router.push('/super-admin/dashboard');
        else if (role === 'ADMIN') router.push('/admin/dashboard');
        else if (role === 'STAFF') router.push('/staff/dashboard');
        else if (role === 'CITIZEN') router.push('/citizen/home');
        else router.push('/');
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-2 overflow-hidden bg-background relative">
      
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

      {/* Right Side: Login Form */}
      <div className="relative z-10 flex flex-col py-8 px-4 sm:px-6 lg:px-12 w-full lg:h-full lg:overflow-y-auto scrollbar-hide">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg z-10 relative my-auto">
          <div className="bg-background py-10 px-6 shadow-neu sm:rounded-3xl sm:px-12 border-0">
            
            <div className="flex flex-col items-center mb-10">
              <Image src="/assets/logo.png" alt="SamaySetu Logo" width={80} height={80} className="object-contain drop-shadow-md mb-4 block lg:hidden" />
              
              {view === 'login' && (
                <>
                  <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                    Sign in to SamaySetu
                  </h2>
                  <p className="mt-3 text-center text-sm sm:text-base text-muted-foreground font-semibold">
                    Don't wait in line. Arrive when it's your turn.
                  </p>
                </>
              )}
              {view === 'forgot' && (
                <>
                  <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                    Reset Password
                  </h2>
                  <p className="mt-3 text-center text-sm sm:text-base text-muted-foreground font-semibold">
                    Enter your email to receive an OTP.
                  </p>
                </>
              )}
              {view === 'forgot-otp' && (
                <>
                  <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                    Verify OTP
                  </h2>
                  <p className="mt-3 text-center text-sm sm:text-base text-muted-foreground font-semibold">
                    Enter the code sent to {resetEmail}
                  </p>
                </>
              )}
              {view === 'reset' && (
                <>
                  <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                    New Password
                  </h2>
                  <p className="mt-3 text-center text-sm sm:text-base text-muted-foreground font-semibold">
                    Create a new secure password.
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="bg-background shadow-neu-inset text-destructive font-semibold px-4 py-3 rounded-xl text-sm text-center mb-8">
                {error}
              </div>
            )}

            {view === 'login' && (
              <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }}>
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
                      placeholder="admin@samaysetu.demo"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

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
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-5 w-5 text-primary bg-background shadow-neu-inset border-0 rounded focus:ring-primary focus:ring-2 focus:ring-offset-background transition-all cursor-pointer accent-primary"
                    />
                    <label htmlFor="remember-me" className="ml-3 block text-base font-semibold text-muted-foreground cursor-pointer">
                      Remember me
                    </label>
                  </div>

                  <div className="text-base">
                    <button type="button" onClick={() => { setError(''); setView('forgot'); }} className="font-bold text-primary hover:text-primary/80 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-base text-muted-foreground font-medium">
                    Don't have an account?{' '}
                    <Link href="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
                      Register here
                    </Link>
                  </p>
                </div>
              </form>
            )}

            {view === 'forgot' && (
              <form className="space-y-8" onSubmit={handleForgotPassword}>
                <div>
                  <Label htmlFor="resetEmail" className="text-muted-foreground font-semibold ml-2 text-base">Email address</Label>
                  <div className="mt-3 relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <Input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-12 h-14 text-base rounded-xl"
                      placeholder="Enter your registered email"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl" disabled={isLoading || !resetEmail}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </div>
                <div className="mt-6 text-center">
                  <button type="button" onClick={() => { setError(''); setView('login'); }} className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors underline underline-offset-4">
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            {view === 'forgot-otp' && (
              <form className="space-y-8" onSubmit={handleVerifyResetOtp}>
                <div>
                  <Label htmlFor="resetOtp" className="text-muted-foreground font-semibold ml-2 text-base">6-Digit Code</Label>
                  <div className="mt-3 relative rounded-2xl">
                    <Input
                      id="resetOtp"
                      type="text"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      className="h-16 text-center text-3xl tracking-[0.5em] sm:tracking-[0.8em] font-extrabold rounded-2xl bg-background shadow-neu-inset"
                      placeholder="••••••"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl" disabled={isLoading || resetOtp.length !== 6}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                    ) : (
                      'Verify OTP'
                    )}
                  </Button>
                </div>

                <div className="mt-6 flex flex-col items-center space-y-4">
                  <p className="text-sm text-muted-foreground font-medium">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={() => handleForgotPassword()}
                      disabled={resendTimer > 0 || isLoading}
                      className={`font-bold transition-colors ${resendTimer > 0 ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-primary hover:text-primary/80'}`}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </p>
                  <button type="button" onClick={() => { setError(''); setView('forgot'); }} className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors underline underline-offset-4">
                    Change Email Address
                  </button>
                </div>
              </form>
            )}

            {view === 'reset' && (
              <form className="space-y-8" onSubmit={handleResetPassword}>
                <div>
                  <Label htmlFor="newPassword" className="text-muted-foreground font-semibold ml-2 text-base">New Password</Label>
                  <div className="mt-3 relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-12 h-14 text-base rounded-xl"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-muted-foreground font-semibold ml-2 text-base">Confirm Password</Label>
                  <div className="mt-3 relative rounded-xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-12 h-14 text-base rounded-xl"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl" disabled={isLoading || !newPassword || !confirmPassword}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
                    ) : (
                      'Reset & Login'
                    )}
                  </Button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
