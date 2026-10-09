'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export function HRLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      // Route smoothly into the HR Console
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040614] text-white flex flex-col justify-between items-center relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Graphic: Cyber Grid */}
      <div className="absolute inset-0 bg-grid-cyber pointer-events-none z-0 opacity-70" />

      {/* Floating Animated Ambient Glow Orbs */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/20 rounded-full blur-[130px] pointer-events-none animate-pulse-glow z-0" />
      <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-cyan-500/15 rounded-full blur-[110px] pointer-events-none animate-float-slow z-0" />
      <div className="absolute top-1/3 -right-48 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none animate-float-reverse z-0" />

      {/* Top Navigation Bar / Branding */}
      <header className="w-full border-b border-white/[0.06] bg-[#040614]/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            <div className="p-1 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-sm shadow-blue-500/10">
              <Image
                src="/logo.svg"
                alt="LinkedIn Community Bangladesh"
                width={84}
                height={25}
                className="h-6 sm:h-7 w-auto object-contain"
                priority
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-tight">
                HR Operations Portal
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                LinkedIn Community Bangladesh
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="hidden xs:inline">System Active</span>
            <span className="text-emerald-400/50 hidden xs:inline">•</span>
            <span>Season 2026</span>
          </div>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="w-full flex-1 flex items-center justify-center px-4 py-10 sm:py-16 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Card Wrapper with Multi-Layer Cyber Glass Styling */}
          <div className="relative rounded-3xl border border-white/[0.12] bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-[#040614]/95 p-6 sm:p-9 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
            {/* Top Accent Line */}
            <div className="absolute top-0 left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

            {/* Header Content */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 mb-4 shadow-inner shadow-blue-500/20">
                <Lock className="w-5 h-5 text-cyan-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                HR Portal Login
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
                Sign in with authorized administrative credentials to access recruitment operations.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-scale-in">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Username Input */}
              <div>
                <label
                  htmlFor="hr-username"
                  className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider"
                >
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="hr-username"
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter HR username"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition-all focus:border-cyan-400 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="hr-password"
                    className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="hr-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 transition-all focus:border-cyan-400 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors focus:outline-none rounded-lg"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 group relative flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-300 hover:from-blue-500 hover:to-cyan-500 hover:shadow-cyan-500/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to HR Console</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Security Notice Footnote */}
            <div className="mt-7 pt-5 border-t border-white/[0.08] flex items-center justify-center gap-2 text-center text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
              <span>Protected System • Authorized HR Personnel Only</span>
            </div>
          </div>

          {/* Subtext info */}
          <div className="mt-6 text-center text-xs text-slate-500">
            <p>
              Looking for your application status? Please use the personal link sent to your email.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.06] py-5 px-4 text-center text-xs text-slate-500 relative z-10 bg-[#040614]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span>&copy; {new Date().getFullYear()} LinkedIn Community Bangladesh. All rights reserved.</span>
          <span className="text-[11px] text-slate-600">
            Recruitment & Talent Operations Management
          </span>
        </div>
      </footer>
    </div>
  );
}
