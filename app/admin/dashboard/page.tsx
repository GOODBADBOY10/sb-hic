'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalRegistered: number;
  fullyPaid: number;
  partiallyPaid: number;
  paymentPending: number;
  expected: number;
  present: number;
  notYetArrived: number;
  attendancePercentage: number;
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl border border-[#0F3D2E]/10 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#4A5D23]">{label}</p>
      <p className={`mt-1.5 text-3xl font-black ${accent ?? 'text-[#14170F]'}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return null;
        }
        return res.json().then((data) => ({ ok: res.ok, data }));
      })
      .then((result) => {
        if (!result) return;
        if (!result.ok) throw new Error(result.data.error);
        setStats(result.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-57px)] items-center justify-center md:min-h-screen">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F3D2E]/15 border-t-[#0F3D2E]" />
      </main>
    );
  }

  if (error || !stats) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error || 'Could not load dashboard.'}</p>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10">
      <p className="text-sm font-semibold text-[#4A5D23]">Overview</p>
      <h1 className="text-2xl font-black text-[#14170F]">Camp Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Registered" value={stats.totalRegistered} />
        <StatCard label="Fully Paid" value={stats.fullyPaid} accent="text-emerald-600" />
        <StatCard label="Partially Paid" value={stats.partiallyPaid} accent="text-amber-600" />
        <StatCard label="Payment Pending" value={stats.paymentPending} accent="text-red-500" />
        <StatCard label="Expected at Camp" value={stats.expected} />
        <StatCard label="Present" value={stats.present} accent="text-emerald-600" />
        <StatCard label="Not Yet Arrived" value={stats.notYetArrived} accent="text-amber-600" />
        <StatCard label="Attendance %" value={`${stats.attendancePercentage}%`} />
      </div>

      <div className="mt-8 rounded-2xl border border-[#0F3D2E]/10 bg-white p-6">
        <h2 className="text-sm font-extrabold">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="/admin/check-in" className="rounded-full bg-[#0F3D2E] px-5 py-2.5 text-xs font-bold text-[#F7F3E8]">Open Check-In Mode</a>
          <a href="/admin/participants" className="rounded-full border border-[#0F3D2E]/20 px-5 py-2.5 text-xs font-semibold text-[#0F3D2E]">View Participants</a>
          <a href="/admin/reports" className="rounded-full border border-[#0F3D2E]/20 px-5 py-2.5 text-xs font-semibold text-[#0F3D2E]">Export Reports</a>
        </div>
      </div>
    </main>
  );
}
