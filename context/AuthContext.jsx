'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Hydrate authentication session on component mount via /api/auth/me
   */
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.user) {
          setUser(result.data.user);
          setError(null);
          return result.data.user;
        }
      }
      setUser(null);
      return null;
    } catch (err) {
      console.warn('Session hydration notice:', err.message);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /**
   * Log in user with email and password
   */
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg = data.message || 'Invalid email or password.';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }

      setUser(data.data.user);
      return { success: true, user: data.data.user };
    } catch (err) {
      const errorMsg = 'Network connection failed. Please try again.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  /**
   * Register a new visitor account
   */
  const register = async (userData) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg = data.message || 'Registration failed. Please check inputs.';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }

      setUser(data.data.user);
      return { success: true, user: data.data.user };
    } catch (err) {
      const errorMsg = 'Network error occurred during registration.';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  /**
   * Log out authenticated visitor and clear session cookie
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  /**
   * Update permitted profile fields
   */
  const updateProfile = async (profileData) => {
    setError(null);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Failed to update profile.' };
      }

      setUser(data.data.user);
      return { success: true, user: data.data.user, message: data.message };
    } catch (err) {
      return { success: false, message: 'Network error during profile update.' };
    }
  };

  /**
   * Change account password
   */
  const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    try {
      const res = await fetch('/api/users/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Failed to change password.' };
      }

      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: 'Network error during password update.' };
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
