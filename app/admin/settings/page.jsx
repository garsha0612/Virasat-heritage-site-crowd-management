'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  Server,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  User,
  Info,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminSettingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Unable to retrieve settings.');
      }
    } catch {
      setError('Network communication error while loading settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordMsg(null);
      const res = await fetch('/api/admin/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPasswordMsg({ type: 'success', text: 'Administrator password changed successfully.' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMsg({ type: 'error', text: json.message || 'Failed to change password.' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Network communication error.' });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton variant="title" className="w-64 h-8" />
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  const { profile, systemInfo } = data || {};

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title */}
      <div className="pb-6 border-b border-heritage-sandstone/30">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-heritage-charcoal">
          Administrative Settings & Infrastructure
        </h1>
        <p className="text-xs text-heritage-charcoal-400 font-sans mt-1">
          Profile verification, credential rotation, and system architectural specifications.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Profile Dossier & Change Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Administrator Profile Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-heritage-sandstone/20">
            <User className="w-4 h-4 text-heritage-green" />
            <h2 className="font-serif text-base font-bold text-heritage-charcoal">
              Administrator Profile
            </h2>
          </div>

          <div className="space-y-3 text-xs font-sans">
            <div>
              <span className="text-[10px] text-heritage-charcoal-400 font-mono uppercase block">
                Full Name
              </span>
              <p className="font-bold text-heritage-charcoal mt-0.5">{profile?.name}</p>
            </div>
            <div>
              <span className="text-[10px] text-heritage-charcoal-400 font-mono uppercase block">
                Official Email
              </span>
              <p className="font-mono text-heritage-charcoal mt-0.5">{profile?.email}</p>
            </div>
            <div>
              <span className="text-[10px] text-heritage-charcoal-400 font-mono uppercase block">
                Privilege Role
              </span>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase bg-heritage-green/10 text-heritage-green">
                {profile?.role}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-heritage-charcoal-400 font-mono uppercase block">
                Contact Phone
              </span>
              <p className="font-mono text-heritage-charcoal mt-0.5">{profile?.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-heritage-sandstone/20">
            <Key className="w-4 h-4 text-heritage-green" />
            <h2 className="font-serif text-base font-bold text-heritage-charcoal">
              Rotate Password
            </h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs font-sans">
            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-1 focus:ring-heritage-green font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                New Password (min 8 chars) *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-1 focus:ring-heritage-green font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-heritage-charcoal mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-heritage-sandstone/30 focus:outline-none focus:ring-1 focus:ring-heritage-green font-mono"
              />
            </div>

            {passwordMsg && (
              <div
                className={`p-2.5 rounded-xl text-xs ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={changingPassword}
              leftIcon={Save}
              className="w-full justify-center bg-heritage-green hover:bg-heritage-green-800 text-white mt-2"
            >
              {changingPassword ? 'Updating Password...' : 'Save New Password'}
            </Button>
          </form>
        </div>
      </div>

      {/* System Information & Architecture Specifications */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-heritage-sandstone/30 shadow-heritage-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-heritage-sandstone/20">
          <Server className="w-4 h-4 text-heritage-green" />
          <h2 className="font-serif text-base font-bold text-heritage-charcoal">
            System & Deployment Specifications
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
          <div className="p-3.5 rounded-2xl bg-heritage-sandstone-50 border border-heritage-sandstone/20 space-y-1">
            <span className="text-[10px] text-heritage-charcoal-400 font-mono uppercase block">
              Application Framework
            </span>
            <p className="font-bold text-heritage-charcoal">{systemInfo?.framework}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-heritage-sandstone-50 border border-heritage-sandstone/20 space-y-1">
            <span className="text-[10px] text-heritage-charcoal-400 font-mono uppercase block">
              Node.js Runtime
            </span>
            <p className="font-mono font-bold text-heritage-charcoal">{systemInfo?.nodeVersion}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-heritage-sandstone-50 border border-heritage-sandstone/20 space-y-1">
            <span className="text-[10px] text-heritage-charcoal-400 font-mono uppercase block">
              Database Topology
            </span>
            <p className="font-bold text-heritage-green">{systemInfo?.databaseTopology}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-heritage-sandstone-50 border border-heritage-sandstone/20 space-y-1">
            <span className="text-[10px] text-heritage-charcoal-400 font-mono uppercase block">
              Multi-Document Transactions
            </span>
            <p className="font-bold text-emerald-700">
              {systemInfo?.transactionSupport ? 'Supported (ACID Majority)' : 'Not Supported'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-heritage-sandstone-50 border border-heritage-sandstone/20 space-y-1">
            <span className="text-[10px] text-heritage-charcoal-400 font-mono uppercase block">
              Platform Release
            </span>
            <p className="font-bold text-heritage-charcoal">{systemInfo?.platformVersion || 'v1.0.0 (Production Master)'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-heritage-sandstone-50 border border-heritage-sandstone/20 space-y-1">
            <span className="text-[10px] text-heritage-charcoal-400 font-mono uppercase block">
              Runtime Environment
            </span>
            <p className="font-mono font-bold text-heritage-charcoal">{systemInfo?.environment}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
