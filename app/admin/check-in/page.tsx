'use client';

import { useEffect, useState } from 'react';

interface Participant {
  id: string;
  registrationId: string;
  surname: string;
  otherName: string;
  gender: string;
  paymentStatus: string;
  class: { name: string } | null;
  house: { name: string } | null;
  attendance: { status: string; checkInTime: string | null; checkedInBy: string | null } | null;
}

export default function CheckInModePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Participant[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Participant | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'blocked'; text: string } | null>(null);
  const [counts, setCounts] = useState<{ present: number; expected: number } | null>(null);

  async function loadCounts() {
    const res = await fetch('/api/admin/stats');
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return;
    }
    if (res.ok) {
      const s = await res.json();
      setCounts({ present: s.present, expected: s.expected });
    }
  }

  useEffect(() => {
    loadCounts();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSelected(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/attendance/search?q=${encodeURIComponent(query.trim())}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setResults(data.participants || []);
    } finally {
      setSearching(false);
    }
  }

  function selectParticipant(p: Participant) {
    setSelected(p);
    setConfirming(false);
    setMessage(null);
  }

  async function doCheckIn() {
    if (!selected) return;
    setCheckingIn(true);
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: selected.id }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setMessage({ type: 'error', text: `Already checked in at ${new Date(data.checkInTime).toLocaleTimeString()}.` });
        setConfirming(false);
        return;
      }
      if (res.status === 403) {
        setMessage({ type: 'blocked', text: data.error });
        setConfirming(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Check-in failed.');

      setMessage({ type: 'success', text: 'Successfully checked in.' });
      setCounts({ present: data.present, expected: data.expected });
      setSelected({
        ...selected,
        attendance: { status: 'PRESENT', checkInTime: data.checkInTime, checkedInBy: 'you' },
      });
      setConfirming(false);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setCheckingIn(false);
    }
  }

  const isPaid = selected?.paymentStatus === 'FULLY_PAID';
  const isPresent = selected?.attendance?.status === 'PRESENT';

  return (
    <main className="min-h-screen bg-[#0A2A20] px-5 py-8 text-[#F7F3E8]">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black">Check-In Mode</h1>
          {counts && (
            <span className="rounded-full bg-[#0F3D2E] px-4 py-1.5 text-sm font-bold text-[#E8B923]">
              {counts.present} / {counts.expected}
            </span>
          )}
        </div>
        <a href="/admin/dashboard" className="mt-1 inline-block text-xs text-[#C9D6C4] underline">← Back to dashboard</a>

        {/* Big search */}
        <form onSubmit={handleSearch} className="mt-6">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone or registration ID"
            className="w-full rounded-2xl border-2 border-[#E8B923]/30 bg-[#0F3D2E] px-5 py-5 text-lg font-semibold text-[#F7F3E8] placeholder:text-[#C9D6C4]/60 outline-none focus:border-[#E8B923]"
          />
          <button
            type="submit"
            disabled={searching}
            className="mt-3 w-full rounded-full bg-[#E8B923] px-6 py-3.5 text-sm font-bold text-[#0A2A20] disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>

        {/* Results list */}
        {!selected && results.length > 0 && (
          <div className="mt-5 space-y-2">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => selectParticipant(p)}
                className="block w-full rounded-2xl bg-[#0F3D2E] px-5 py-4 text-left"
              >
                <p className="font-bold">{p.otherName} {p.surname}</p>
                <p className="text-xs text-[#C9D6C4]">{p.registrationId} · {p.class?.name ?? 'No class'}</p>
              </button>
            ))}
          </div>
        )}

        {!selected && results.length === 0 && !searching && query && (
          <p className="mt-5 text-sm text-[#C9D6C4]">No matches found.</p>
        )}

        {/* Selected participant card */}
        {selected && (
          <div className="mt-6 rounded-3xl bg-[#0F3D2E] p-6">
            <button onClick={() => setSelected(null)} className="mb-3 text-xs text-[#C9D6C4] underline">
              ← Back to results
            </button>
            <h2 className="text-2xl font-black">{selected.otherName} {selected.surname}</h2>
            <p className="text-sm text-[#C9D6C4]">{selected.registrationId}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-[#C9D6C4]">Class</p><p className="font-bold">{selected.class?.name ?? '—'}</p></div>
              <div><p className="text-xs text-[#C9D6C4]">Gender</p><p className="font-bold">{selected.gender === 'MALE' ? 'Male' : 'Female'}</p></div>
              <div><p className="text-xs text-[#C9D6C4]">House</p><p className="font-bold">{selected.house?.name ?? 'Not assigned'}</p></div>
              <div>
                <p className="text-xs text-[#C9D6C4]">Payment</p>
                <p className={`font-bold ${isPaid ? 'text-emerald-400' : 'text-red-400'}`}>{selected.paymentStatus.replace('_', ' ')}</p>
              </div>
            </div>

            {message && (
              <p
                className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                  message.type === 'success' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
                }`}
              >
                {message.text}
              </p>
            )}

            {isPresent ? (
              <div className="mt-5 rounded-xl bg-emerald-500/15 px-4 py-4 text-center">
                <p className="font-bold text-emerald-300">✓ Checked In</p>
                {selected.attendance?.checkInTime && (
                  <p className="text-xs text-[#C9D6C4]">at {new Date(selected.attendance.checkInTime).toLocaleTimeString()}</p>
                )}
              </div>
            ) : !isPaid ? (
              <div className="mt-5 rounded-xl bg-red-500/15 px-4 py-4 text-center text-sm font-semibold text-red-300">
                Payment not completed — cannot be checked in.
              </div>
            ) : confirming ? (
              <div className="mt-5 space-y-3">
                <p className="text-center text-sm font-semibold">
                  Confirm check-in for {selected.otherName} {selected.surname}?
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirming(false)} className="flex-1 rounded-full border border-[#F7F3E8]/20 py-3.5 text-sm font-semibold">
                    Cancel
                  </button>
                  <button
                    onClick={doCheckIn}
                    disabled={checkingIn}
                    className="flex-1 rounded-full bg-[#E8B923] py-3.5 text-sm font-bold text-[#0A2A20] disabled:opacity-50"
                  >
                    {checkingIn ? 'Checking in…' : 'Check In'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="mt-5 w-full rounded-2xl bg-[#E8B923] py-5 text-lg font-black text-[#0A2A20]"
              >
                CHECK IN
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
