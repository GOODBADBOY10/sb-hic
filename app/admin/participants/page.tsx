'use client';

import { useEffect, useState } from 'react';

interface Participant {
  id: string;
  registrationId: string;
  surname: string;
  otherName: string;
  gender: string;
  ageGroup: string;
  category: string;
  zone: string;
  paymentStatus: string;
  attendanceStatus: string;
  createdAt: string;
  class: { name: string } | null;
  house: { name: string } | null;
}

const PAYMENT_STATUSES = ['NOT_PAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'REFUNDED'];
const ATTENDANCE_STATUSES = ['NOT_ARRIVED', 'PRESENT'];
const GENDERS = ['MALE', 'FEMALE'];

const statusColor: Record<string, string> = {
  FULLY_PAID: 'bg-emerald-100 text-emerald-700',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  NOT_PAID: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-200 text-slate-600',
  PRESENT: 'bg-emerald-100 text-emerald-700',
  NOT_ARRIVED: 'bg-slate-100 text-slate-600',
};

const selectClass =
  'rounded-lg border border-[#0F3D2E]/15 bg-white px-3 py-2 text-xs font-semibold text-[#14170F] outline-none focus:border-[#0F3D2E]';

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ gender: '', zone: '', category: '', paymentStatus: '', attendanceStatus: '' });
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    try {
      const res = await fetch(`/api/participants?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setParticipants(data.participants);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const filtered = participants.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.registrationId.toLowerCase().includes(q) ||
      p.surname.toLowerCase().includes(q) ||
      p.otherName.toLowerCase().includes(q)
    );
  });

  return (
    <main className="min-h-screen bg-[#F7F3E8] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <a href="/admin/dashboard" className="text-xs text-[#4A5D23] underline">← Back to dashboard</a>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-[#14170F]">Participants</h1>
          <a
            href="/api/reports/export?type=registrations"
            className="rounded-full bg-[#0F3D2E] px-5 py-2.5 text-xs font-bold text-[#F7F3E8]"
          >
            Export CSV
          </a>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-2">
          <input
            placeholder="Search name or registration ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-[#0F3D2E]/15 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#0F3D2E]"
          />
          <select className={selectClass} value={filters.gender} onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}>
            <option value="">All genders</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g === 'MALE' ? 'Male' : 'Female'}</option>)}
          </select>
          <select className={selectClass} value={filters.paymentStatus} onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}>
            <option value="">All payment statuses</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <select className={selectClass} value={filters.attendanceStatus} onChange={(e) => setFilters((f) => ({ ...f, attendanceStatus: e.target.value }))}>
            <option value="">All attendance</option>
            {ATTENDANCE_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <input
            placeholder="Zone"
            value={filters.zone}
            onChange={(e) => setFilters((f) => ({ ...f, zone: e.target.value }))}
            className="w-28 rounded-lg border border-[#0F3D2E]/15 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#0F3D2E]"
          />
        </div>

        {/* Table */}
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#0F3D2E]/10 bg-white">
          {loading ? (
            <div className="flex justify-center p-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F3D2E]/15 border-t-[#0F3D2E]" />
            </div>
          ) : error ? (
            <p className="p-6 text-sm font-semibold text-red-600">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-[#4B5347]">No participants match these filters.</p>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0F3D2E]/10 text-xs font-bold uppercase tracking-wide text-[#4A5D23]">
                  <th className="px-4 py-3">Reg. ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Age Group</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">House</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-[#0F3D2E]/5 last:border-0 hover:bg-[#F7F3E8]">
                    <td className="px-4 py-3 font-mono text-xs">{p.registrationId}</td>
                    <td className="px-4 py-3 font-semibold">{p.otherName} {p.surname}</td>
                    <td className="px-4 py-3">{p.gender === 'MALE' ? 'Male' : 'Female'}</td>
                    <td className="px-4 py-3">{p.ageGroup}</td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3">{p.class?.name ?? '—'}</td>
                    <td className="px-4 py-3">{p.zone}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor[p.paymentStatus] ?? ''}`}>
                        {p.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.house?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor[p.attendanceStatus] ?? ''}`}>
                        {p.attendanceStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#4B5347]">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-3 text-xs text-[#4B5347]">{filtered.length} participant{filtered.length === 1 ? '' : 's'} shown</p>
      </div>
    </main>
  );
}
