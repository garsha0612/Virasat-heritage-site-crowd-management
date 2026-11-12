'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Globe,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateProfile, changePassword } = useAuth();

  // Profile fields state
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    nationality: 'Indian',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password fields state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Populate form with existing user data
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.replace('/admin/settings');
        return;
      }
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        nationality: user.nationality || 'Indian',
      });
    }
  }, [user, router]);

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (profileData.name.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters long.');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await updateProfile({
        name: profileData.name.trim(),
        phone: profileData.phone.trim(),
        nationality: profileData.nationality.trim(),
      });

      if (res.success) {
        setProfileSuccess('Your profile details have been updated successfully.');
      } else {
        setProfileError(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileError('A network error occurred while updating profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!passwordData.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(passwordData.newPassword)) {
      setPasswordError('New password must contain at least one letter and one number.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (res.success) {
        setPasswordSuccess('Your password has been changed successfully.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setPasswordError(res.message || 'Failed to change password.');
      }
    } catch (err) {
      setPasswordError('A network error occurred while updating password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 sm:py-16">
        <Container size="xl" className="space-y-6 max-w-4xl">
          <Skeleton variant="title" className="w-60 h-10" />
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
        </Container>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-16 bg-heritage-ivory min-h-[calc(100vh-160px)]">
      <Container size="xl" className="max-w-4xl">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-heritage-charcoal-600 hover:text-heritage-green transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Visitor Dashboard</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-heritage-charcoal">
            Account & Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-heritage-charcoal-500 font-sans mt-2">
            Manage your personal contact details, verified nationality tier, and authentication credentials.
          </p>
        </div>

        <div className="space-y-10">
          {/* Section 1: Profile Details */}
          <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-10">
            <div className="flex items-center gap-3 pb-6 border-b border-heritage-sandstone/20">
              <div className="w-10 h-10 rounded-xl bg-heritage-sandstone-100 text-heritage-green flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-heritage-charcoal">
                  Personal Information
                </h2>
                <p className="text-xs text-heritage-charcoal-500 font-sans">
                  Used for ticket issuance and monument visitor identity verification.
                </p>
              </div>
            </div>

            {/* Profile Success Alert */}
            {profileSuccess && (
              <div
                role="status"
                className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-sans">{profileSuccess}</span>
              </div>
            )}

            {/* Profile Error Alert */}
            {profileError && (
              <div
                role="alert"
                className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-sans">{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-5">
              <Input
                label="Full Legal Name"
                type="text"
                required
                value={profileData.name}
                onChange={(e) =>
                  setProfileData({ ...profileData, name: e.target.value })
                }
                leftIcon={User}
                disabled={profileLoading}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-heritage-charcoal-600 mb-1.5 font-sans">
                    Email Address (Immutable)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={user?.email || ''}
                      className="w-full rounded-xl border border-heritage-sandstone/20 bg-heritage-sandstone-100/40 px-3.5 py-2.5 text-xs text-heritage-charcoal-500 cursor-not-allowed select-none font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-heritage-charcoal-400 font-sans">
                      Verified
                    </span>
                  </div>
                  <p className="text-[10px] text-heritage-charcoal-400 mt-1">
                    Contact administration to transfer email bindings.
                  </p>
                </div>

                <Input
                  label="Contact Phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData({ ...profileData, phone: e.target.value })
                  }
                  leftIcon={Phone}
                  disabled={profileLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-heritage-charcoal-600 mb-1.5 font-sans">
                  Nationality / Ticket Category
                </label>
                <select
                  value={profileData.nationality}
                  onChange={(e) =>
                    setProfileData({ ...profileData, nationality: e.target.value })
                  }
                  disabled={profileLoading}
                  className="w-full rounded-xl border border-heritage-sandstone/40 bg-heritage-ivory/50 px-3.5 py-2.5 text-xs text-heritage-charcoal focus:border-heritage-green focus:bg-white focus:outline-none"
                >
                  <option value="Indian">Indian Citizen (Domestic Tariff)</option>
                  <option value="SAARC">SAARC / BIMSTEC National</option>
                  <option value="International">International Tourist (Foreign Tariff)</option>
                </select>
                <p className="text-[10px] text-heritage-charcoal-400 mt-1 font-sans">
                  Subject to physical verification of ID proof at archaeological entry gates.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={profileLoading}
                  leftIcon={Save}
                >
                  {profileLoading ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </div>

          {/* Section 2: Password Management */}
          <div className="bg-white rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm p-6 sm:p-10">
            <div className="flex items-center gap-3 pb-6 border-b border-heritage-sandstone/20">
              <div className="w-10 h-10 rounded-xl bg-heritage-sandstone-100 text-heritage-sandstone-700 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-heritage-charcoal">
                  Change Password
                </h2>
                <p className="text-xs text-heritage-charcoal-500 font-sans">
                  Update your authentication credentials. Requires current password verification.
                </p>
              </div>
            </div>

            {/* Password Success Alert */}
            {passwordSuccess && (
              <div
                role="status"
                className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-sans">{passwordSuccess}</span>
              </div>
            )}

            {/* Password Error Alert */}
            {passwordError && (
              <div
                role="alert"
                className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-sans">{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
              <div className="relative">
                <Input
                  label="Current Password"
                  type={showPasswords ? 'text' : 'password'}
                  required
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  leftIcon={Lock}
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-[34px] p-1.5 text-heritage-charcoal-400 hover:text-heritage-charcoal focus:outline-none"
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                >
                  {showPasswords ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="New Password"
                  type={showPasswords ? 'text' : 'password'}
                  required
                  placeholder="Min. 8 characters with letter & number"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  leftIcon={Lock}
                  disabled={passwordLoading}
                />

                <Input
                  label="Confirm New Password"
                  type={showPasswords ? 'text' : 'password'}
                  required
                  placeholder="Re-type new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  leftIcon={Lock}
                  disabled={passwordLoading}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="outline"
                  size="md"
                  disabled={passwordLoading}
                  leftIcon={KeyRound}
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>

          {/* Section 3: Account Security Details */}
          <div className="bg-heritage-sandstone-100/50 rounded-2xl border border-heritage-sandstone/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-semibold text-heritage-charcoal flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-heritage-green" />
                Session & Role Security
              </p>
              <p className="text-heritage-charcoal-500 font-sans">
                Active role: <strong className="uppercase font-mono text-heritage-green">{user?.role || 'VISITOR'}</strong> • Session token signed with HS256 and encrypted in HTTP-only cookies.
              </p>
            </div>
            <div className="font-mono text-heritage-charcoal-400 text-[11px]">
              Platform: ANVAYA 2026
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
