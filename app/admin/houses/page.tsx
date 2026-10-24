'use client';

import { useEffect, useState } from 'react';

interface House {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  capacity: number;
  status: string;
  occupants: number;
  available: number;
}

interface UnassignedParticipant {
  id: string;
  registrationId: string;
  surname: string;
  otherName: string;
  gender: 'MALE' | 'FEMALE';
}

export default function AdminHousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [unassigned, setUnassigned] = useState<UnassignedParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [newHouse, setNewHouse] = useState({ name: '', gender: 'MALE' as 'MALE' | 'FEMALE', capacity: 40 });
  const [showCreate, setShowCreate] = useState(false);
  const [pendingHouseChoice, setPendingHouseChoice] = useState<Record<string, string>>({});

  async function loadHouses() {
    const res = await fetch('/api/houses');
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return;
    }
    const data = await res.json();
    if (res.ok) setHouses(data.houses);
    else setError(data.error);
  }

  async function loadUnassigned() {
    const res = await fetch('/api/participants?paymentStatus=FULLY_PAID');
    const data = await res.json();
    if (res.ok) {
      setUnassigned((data.participants || []).filter((p: any) => !p.house));
    }
  }

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadHouses(), loadUnassigned()]);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createHouse(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/houses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHouse),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setNewHouse({ name: '', gender: 'MALE', capacity: 40 });
    setShowCreate(false);
    loadHouses();
  }

  async function runAutoAssign() {
    setAutoAssigning(true);
    setMessage(null);
    try {
      const res = await fetch('/api/houses/auto-assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`Assigned ${data.assigned} participant${data.assigned === 1 ? '' : 's'}.${data.unassigned ? ` ${data.unassigned} couldn't be placed (houses full).` : ''}`);
      loadAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAutoAssigning(false);
    }
  }

  async function assignOne(participantId: string) {
    const houseId = pendingHouseChoice[participantId];
    if (!houseId) return;
    setAssigning(participantId);
    try {
      const res = await fetch('/api/houses/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, houseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAssigning(null);
    }
  }

  const eligibleHousesFor = (gender: 'MALE' | 'FEMALE') =>
    houses.filter((h) => h.gender === gender && h.status === 'ACTIVE' && h.available > 0);

  return (
    <main className="min-h-screen bg-[#F7F3E8] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <a href="/admin/dashboard" className="text-xs text-[#4A5D23] underline">← Back to dashboard</a>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-[#14170F]">Houses</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate((s) => !s)} className="rounded-full border border-[#0F3D2E]/20 px-5 py-2.5 text-xs font-semibold text-[#0F3D2E]">
              {showCreate ? 'Cancel' : '+ New House'}
            </button>
            <button
              onClick={runAutoAssign}
              disabled={autoAssigning || unassigned.length === 0}
              className="rounded-full bg-[#0F3D2E] px-5 py-2.5 text-xs font-bold text-[#F7F3E8] disabled:opacity-40"
            >
              {autoAssigning ? 'Assigning…' : `Auto-Assign (${unassigned.length} pending)`}
            </button>
          </div>
        </div>

        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">{error}</p>}

        {showCreate && (
          <form onSubmit={createHouse} className="mt-5 flex flex-wrap items-end gap-3 rounded-2xl border border-[#0F3D2E]/10 bg-white p-5">
            <div>
              <label className="mb-1 block text-xs font-semibold">House Name</label>
              <input required value={newHouse.name} onChange={(e) => setNewHouse((h) => ({ ...h, name: e.target.value }))} className="rounded-lg border border-[#0F3D2E]/15 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Gender</label>
              <select value={newHouse.gender} onChange={(e) => setNewHouse((h) => ({ ...h, gender: e.target.value as any }))} className="rounded-lg border border-[#0F3D2E]/15 px-3 py-2 text-sm">
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Capacity</label>
              <input type="number" value={newHouse.capacity} onChange={(e) => setNewHouse((h) => ({ ...h, capacity: Number(e.target.value) }))} className="w-24 rounded-lg border border-[#0F3D2E]/15 px-3 py-2 text-sm" />
            </div>
            <button type="submit" className="rounded-full bg-[#E8B923] px-5 py-2.5 text-xs font-bold text-[#0A2A20]">Create</button>
          </form>
        )}

        {/* House cards */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex justify-center p-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F3D2E]/15 border-t-[#0F3D2E]" />
            </div>
          ) : (
            houses.map((h) => {
              const pct = h.capacity > 0 ? Math.round((h.occupants / h.capacity) * 100) : 0;
              return (
                <div key={h.id} className="rounded-2xl border border-[#0F3D2E]/10 bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-extrabold">{h.name}</p>
                      <p className="text-xs text-[#4B5347]">{h.gender === 'MALE' ? 'Male' : 'Female'} house</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${h.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                      {h.status}
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#F7F3E8]">
                    <div className="h-full rounded-full bg-[#0F3D2E]" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-sm font-semibold">{h.occupants} / {h.capacity} occupants · {h.available} available</p>
                </div>
              );
            })
          )}
        </div>

        {/* Manual assignment */}
        {unassigned.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-extrabold text-[#14170F]">Manual Assignment — Paid, Unassigned ({unassigned.length})</h2>
            <div className="mt-3 space-y-2">
              {unassigned.map((p) => {
                const options = eligibleHousesFor(p.gender);
                return (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#0F3D2E]/10 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{p.otherName} {p.surname}</p>
                      <p className="text-xs text-[#4B5347]">{p.registrationId} · {p.gender === 'MALE' ? 'Male' : 'Female'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={pendingHouseChoice[p.id] || ''}
                        onChange={(e) => setPendingHouseChoice((c) => ({ ...c, [p.id]: e.target.value }))}
                        className="rounded-lg border border-[#0F3D2E]/15 px-3 py-2 text-xs font-semibold"
                      >
                        <option value="">Select house…</option>
                        {options.map((h) => (
                          <option key={h.id} value={h.id}>{h.name} ({h.available} free)</option>
                        ))}
                      </select>
                      <button
                        onClick={() => assignOne(p.id)}
                        disabled={!pendingHouseChoice[p.id] || assigning === p.id}
                        className="rounded-full bg-[#0F3D2E] px-4 py-2 text-xs font-bold text-[#F7F3E8] disabled:opacity-40"
                      >
                        {assigning === p.id ? 'Assigning…' : 'Assign'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
