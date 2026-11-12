'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res.success) {
        router.push(redirectTarget);
        router.refresh();
      } else {
        setErrorMessage(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setErrorMessage('Unable to connect to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-md p-8 sm:p-10">
      {/* Form Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-heritage-sandstone-100 text-heritage-green mb-3 border border-heritage-sandstone/30">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal tracking-tight">
          Welcome to ANVAYA
        </h1>
        <p className="text-xs text-heritage-charcoal-500 mt-2 font-sans">
          Sign in to access your visitor dashboard, manage time-slot reservations, and view crowd analytics.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-sans">{errorMessage}</div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={Mail}
          disabled={loading}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={Lock}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[34px] p-1.5 text-heritage-charcoal-400 hover:text-heritage-charcoal focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full justify-center mt-2"
          disabled={loading}
          rightIcon={loading ? null : ArrowRight}
        >
          {loading ? 'Authenticating...' : 'Sign In to Portal'}
        </Button>
      </form>

      {/* Footnote & Registration Link */}
      <div className="mt-8 pt-6 border-t border-heritage-sandstone/20 text-center text-xs text-heritage-charcoal-500 font-sans">
        <span>Don&apos;t have a visitor account? </span>
        <Link
          href="/register"
          className="font-semibold text-heritage-green hover:text-heritage-green-800 underline ml-1"
        >
          Create one now
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-md p-10 text-center">
          <p className="text-xs text-heritage-charcoal-500">Loading sign-in form...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
