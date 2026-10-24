'use client';

import { useEffect, useState } from 'react';

interface Programme {
  id: string;
  name: string;
  earlyBirdFee: number;
  flatFee: number;
  earlyBirdDeadline: string;
  defaultHouseCapacity: number;
  registrationOpen: boolean;
  venueName: string;
  venueAddress: string | null;
  campStart: string;
  campEnd: string;
}

export default function AdminSettingsPage() {
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/settings');
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return;
    }
    const data = await res.json();
    if (res.ok) setProgramme(data.programme);
    else setError(data.error);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!programme) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          earlyBirdFee: programme.earlyBirdFee,
          flatFee: programme.flatFee,
          earlyBirdDeadline: programme.earlyBirdDeadline,
          defaultHouseCapacity: programme.defaultHouseCapacity,
          registrationOpen: programme.registrationOpen,
          venueName: programme.venueName,
          venueAddress: programme.venueAddress,
          campStart: programme.campStart,
          campEnd: programme.campEnd,
        }),
      });
      const data = await res.json();
      if (res.status === 403) throw new Error('Only Super Admins can change settings.');
      if (!res.ok) throw new Error(data.error);
      setMessage('Settings saved.');
      setProgramme(data.programme);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F3D2E]/15 border-t-[#0F3D2E]" />
      </main>
    );
  }

  if (!programme) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8] px-6">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error || 'No programme configured.'}</p>
      </main>
    );
  }

  const field = (label: string, value: string | number, onChange: (v: string) => void, type = 'text') => (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#14170F]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#0F3D2E]/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#0F3D2E]"
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F7F3E8] px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <a href="/admin/dashboard" className="text-xs text-[#4A5D23] underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-black text-[#14170F]">Settings</h1>
        <p className="mt-1 text-sm text-[#4B5347]">{programme.name}</p>

        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">{error}</p>}

        <form onSubmit={handleSave} className="mt-5 space-y-6 rounded-3xl border border-[#0F3D2E]/10 bg-white p-7">
          <div>
            <h2 className="text-sm font-extrabold text-[#4A5D23]">Fees</h2>
            <div className="mt-3 grid grid-cols-2 gap-4">
              {field('Early Bird Fee (₦)', programme.earlyBirdFee, (v) => setProgramme({ ...programme, earlyBirdFee: Number(v) }), 'number')}
              {field('Flat Rate Fee (₦)', programme.flatFee, (v) => setProgramme({ ...programme, flatFee: Number(v) }), 'number')}
            </div>
            <div className="mt-4">
              {field('Early Bird Deadline', programme.earlyBirdDeadline.slice(0, 10), (v) => setProgramme({ ...programme, earlyBirdDeadline: v }), 'date')}
            </div>
          </div>

          <div className="border-t border-[#0F3D2E]/10 pt-5">
            <h2 className="text-sm font-extrabold text-[#4A5D23]">Houses</h2>
            <div className="mt-3">
              {field('Default House Capacity', programme.defaultHouseCapacity, (v) => setProgramme({ ...programme, defaultHouseCapacity: Number(v) }), 'number')}
            </div>
          </div>

          <div className="border-t border-[#0F3D2E]/10 pt-5">
            <h2 className="text-sm font-extrabold text-[#4A5D23]">Venue &amp; Dates</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field('Venue Name', programme.venueName, (v) => setProgramme({ ...programme, venueName: v }))}
              {field('Venue Address', programme.venueAddress || '', (v) => setProgramme({ ...programme, venueAddress: v }))}
              {field('Camp Start', programme.campStart.slice(0, 10), (v) => setProgramme({ ...programme, campStart: v }), 'date')}
              {field('Camp End', programme.campEnd.slice(0, 10), (v) => setProgramme({ ...programme, campEnd: v }), 'date')}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#0F3D2E]/10 pt-5">
            <div>
              <p className="text-sm font-bold">Registration Open</p>
              <p className="text-xs text-[#4B5347]">Turn off to stop accepting new registrations.</p>
            </div>
            <button
              type="button"
              onClick={() => setProgramme({ ...programme, registrationOpen: !programme.registrationOpen })}
              className={`h-7 w-12 rounded-full transition-colors ${programme.registrationOpen ? 'bg-[#0F3D2E]' : 'bg-slate-300'}`}
            >
              <span className={`block h-5 w-5 translate-y-1 rounded-full bg-white transition-transform ${programme.registrationOpen ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <button type="submit" disabled={saving} className="w-full rounded-full bg-[#E8B923] px-6 py-3.5 text-sm font-bold text-[#0A2A20] disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>
    </main>
  );
}
