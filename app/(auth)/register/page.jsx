'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nationality: 'Indian',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validations
    if (formData.name.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
      setErrorMessage('Password must contain at least one letter and one number.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        nationality: formData.nationality.trim(),
      });

      if (res.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setErrorMessage(res.message || 'Registration failed. Please check inputs.');
      }
    } catch (err) {
      setErrorMessage('Unable to connect to registration service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-md p-8 sm:p-10 my-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-heritage-sandstone-100 text-heritage-green mb-3 border border-heritage-sandstone/30">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal tracking-tight">
          Create Visitor Account
        </h1>
        <p className="text-xs text-heritage-charcoal-500 mt-2 font-sans">
          Register with ANVAYA to access dynamic crowd telemetry and reserve entry slots.
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

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Legal Name"
          type="text"
          name="name"
          required
          placeholder="e.g. Aarav Sharma"
          value={formData.name}
          onChange={handleChange}
          leftIcon={User}
          disabled={loading}
        />

        <Input
          label="Email Address"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="aarav.sharma@example.com"
          value={formData.email}
          onChange={handleChange}
          leftIcon={Mail}
          disabled={loading}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number (Optional)"
            type="tel"
            name="phone"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={handleChange}
            leftIcon={Phone}
            disabled={loading}
          />

          <div>
            <label className="block text-xs font-semibold text-heritage-charcoal-600 mb-1.5 font-sans">
              Nationality
            </label>
            <div className="relative">
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                disabled={loading}
                className="w-full rounded-xl border border-heritage-sandstone/40 bg-heritage-ivory/50 px-3.5 py-2.5 text-xs text-heritage-charcoal focus:border-heritage-green focus:bg-white focus:outline-none"
              >
                <option value="Indian">Indian Citizen</option>
                <option value="SAARC">SAARC / BIMSTEC National</option>
                <option value="International">International Tourist</option>
              </select>
            </div>
          </div>
        </div>

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            required
            placeholder="At least 8 chars, 1 letter & 1 number"
            value={formData.password}
            onChange={handleChange}
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

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          autoComplete="new-password"
          required
          placeholder="Re-type your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          leftIcon={Lock}
          disabled={loading}
        />

        <p className="text-[11px] text-heritage-charcoal-400 font-sans leading-relaxed pt-1">
          By registering, you agree to abide by the archaeological preservation guidelines of the Archaeological Survey of India (ASI).
        </p>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full justify-center mt-3"
          disabled={loading}
          rightIcon={loading ? null : ArrowRight}
        >
          {loading ? 'Creating Account...' : 'Register Visitor Account'}
        </Button>
      </form>

      {/* Footnote & Login Link */}
      <div className="mt-8 pt-6 border-t border-heritage-sandstone/20 text-center text-xs text-heritage-charcoal-500 font-sans">
        <span>Already have an account? </span>
        <Link
          href="/login"
          className="font-semibold text-heritage-green hover:text-heritage-green-800 underline ml-1"
        >
          Sign In here
        </Link>
      </div>
    </div>
  );
}
