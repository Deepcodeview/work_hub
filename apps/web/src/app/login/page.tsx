'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Lock,
  Mail,
  ArrowRight,
} from '../../components/icons';
import { api, setStoredSession } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@workhub.internal');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await api.auth.login(email, password);

      if (res.success && res.data?.accessToken) {
        setSuccess('Authentication successful! Redirecting to workspace...');
        setTimeout(() => {
          router.push('/');
        }, 800);
      } else {
        setError(res.error?.message || res.message || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword('Password123!');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSent(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#FBF9F5] via-[#FFF7EE] to-[#FBF9F5]">
      {/* Background Decorative Mountain Layer */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none opacity-40">
        <svg
          className="w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 1200 200"
          fill="none"
        >
          <path d="M 0,200 L 250,70 L 600,200 Z" fill="#FFCCA0" />
          <path d="M 400,200 L 750,50 L 1200,200 Z" fill="#FFB67E" />
          <path d="M 150,200 L 450,110 L 850,200 Z" fill="#FFA561" />
        </svg>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#F1ECE4] shadow-xl p-8 relative z-10 animate-in fade-in duration-300">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF981A] to-[#FF7A00] flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-md shadow-orange-500/25 mb-3">
            W
          </div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">
            Sign in to WorkHub
          </h1>
          <p className="text-xs sm:text-sm text-[#8A92A6] mt-1">
            Workforce operations, attendance, & project management
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.internal"
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl focus:outline-none focus:border-[#FF8A00] focus:bg-white text-[#1F2937] transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#64748B]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-semibold text-[#FF8A00] hover:text-[#E67C00] transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl focus:outline-none focus:border-[#FF8A00] focus:bg-white text-[#1F2937] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-[#F1ECE4]">
          <span className="text-[11px] font-bold text-[#8A92A6] uppercase tracking-wider block mb-2 text-center">
            One-Click Demo Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@workhub.internal')}
              className="px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] hover:bg-[#FFF0E0] hover:border-[#FFCCA0] text-xs font-semibold text-[#1F2937] transition-all text-center"
            >
              👑 System Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('jane.doe@workhub.internal')}
              className="px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] hover:bg-[#FFF0E0] hover:border-[#FFCCA0] text-xs font-semibold text-[#1F2937] transition-all text-center"
            >
              👩‍💻 Engineering Staff
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#F1ECE4] p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1ECE4] pb-3">
              <h2 className="text-base font-bold text-[#1F2937]">Reset Password</h2>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-full text-[#8A92A6] hover:text-[#1F2937]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSent ? (
              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold rounded-xl text-center">
                ✓ Password reset instructions sent to your work email!
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-[#8A92A6]">
                  Enter your registered work email and we will dispatch a secure one-time password reset link.
                </p>
                <div>
                  <label className="text-xs font-bold text-[#64748B] block mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@company.internal"
                    className="w-full px-3 py-2 rounded-xl border border-[#E2DDD5] bg-[#FAF7F2] text-xs font-medium text-[#1F2937] outline-none focus:border-[#FF8A00]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-full border border-[#E2DDD5] text-xs font-semibold text-[#64748B] hover:bg-[#FAF7F2]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-semibold shadow-xs"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
