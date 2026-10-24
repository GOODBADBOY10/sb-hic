'use client';

import { useState } from 'react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');
      window.location.href = '/admin/dashboard';
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0F3D2E] px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl bg-[#F7F3E8] p-8 shadow-2xl">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#E8B923] text-sm font-black text-[#0A2A20]">
          SB
        </div>
        <h1 className="text-center text-xl font-black text-[#14170F]">Admin Login</h1>
        <p className="mt-1 text-center text-xs text-[#4B5347]">SB HIC 2026 — Camp Management</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#14170F]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#0F3D2E]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#E8B923]/40"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#14170F]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#0F3D2E]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#E8B923]/40"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-[#0F3D2E] px-6 py-3.5 text-sm font-bold text-[#F7F3E8] disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </main>
  );
}
