'use client';

import { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  zone: string | null;
  status: string;
  isProtected: boolean;
  createdAt: string;
}

const ROLES = [
  'SUPER_ADMIN', 'REGISTRATION_ADMIN', 'FINANCE_ADMIN',
  'ATTENDANCE_ADMIN', 'HOUSE_ADMIN', 'VIEWER', 'ZONE_ADMIN',
];

const EMPTY_NEW = { name: '', email: '', password: '', role: 'VIEWER', zone: '' };

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newAdmin, setNewAdmin] = useState(EMPTY_NEW);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return;
    }
    const data = await res.json();
    if (res.status === 403) {
      setError('Only Super Admins can manage admin accounts.');
    } else if (res.ok) {
      setAdmins(data.admins);
    } else {
      setError(data.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createAdmin(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAdmin, zone: newAdmin.zone || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewAdmin(EMPTY_NEW);
      setShowCreate(false);
      setMessage(`${data.admin.name} added as ${data.admin.role.replace('_', ' ')}.`);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function deactivate(admin: AdminUser) {
    if (!window.confirm(`Deactivate ${admin.name}? They won't be able to log in until reactivated.`)) return;
    setBusyId(admin.id);
    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DEACTIVATED' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function reactivate(admin: AdminUser) {
    setBusyId(admin.id);
    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F3E8] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <a href="/admin/dashboard" className="text-xs text-[#4A5D23] underline">← Back to dashboard</a>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-[#14170F]">Admin Users</h1>
          <button onClick={() => setShowCreate((s) => !s)} className="rounded-full bg-[#0F3D2E] px-5 py-2.5 text-xs font-bold text-[#F7F3E8]">
            {showCreate ? 'Cancel' : '+ Add Admin'}
          </button>
        </div>

        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">{error}</p>}

        {showCreate && (
          <form onSubmit={createAdmin} className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-[#0F3D2E]/10 bg-white p-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Name</label>
              <input required value={newAdmin.name} onChange={(e) => setNewAdmin((a) => ({ ...a, name: e.target.value }))} className="w-full rounded-lg border border-[#0F3D2E]/15 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Email</label>
              <input type="email" required value={newAdmin.email} onChange={(e) => setNewAdmin((a) => ({ ...a, email: e.target.value }))} className="w-full rounded-lg border border-[#0F3D2E]/15 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Temporary Password (min. 8 chars)</label>
              <input type="password" required minLength={8} value={newAdmin.password} onChange={(e) => setNewAdmin((a) => ({ ...a, password: e.target.value }))} className="w-full rounded-lg border border-[#0F3D2E]/15 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Role</label>
              <select value={newAdmin.role} onChange={(e) => setNewAdmin((a) => ({ ...a, role: e.target.value }))} className="w-full rounded-lg border border-[#0F3D2E]/15 px-3 py-2 text-sm">
                {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold">Zone (optional — leave blank for org-wide access)</label>
              <input value={newAdmin.zone} onChange={(e) => setNewAdmin((a) => ({ ...a, zone: e.target.value }))} placeholder="e.g. Ile-Ife" className="w-full rounded-lg border border-[#0F3D2E]/15 px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={creating} className="rounded-full bg-[#E8B923] px-5 py-2.5 text-xs font-bold text-[#0A2A20] disabled:opacity-50 sm:col-span-2">
              {creating ? 'Creating…' : 'Create Admin'}
            </button>
          </form>
        )}

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#0F3D2E]/10 bg-white">
          {loading ? (
            <div className="flex justify-center p-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F3D2E]/15 border-t-[#0F3D2E]" />
            </div>
          ) : (
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#0F3D2E]/10 text-xs font-bold uppercase tracking-wide text-[#4A5D23]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} className="border-b border-[#0F3D2E]/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{a.name} {a.isProtected && <span className="text-[10px] text-[#4A5D23]">(protected)</span>}</p>
                      <p className="text-xs text-[#4B5347]">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{a.role.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs">{a.zone || 'Org-wide'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${a.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!a.isProtected && (
                        a.status === 'ACTIVE' ? (
                          <button onClick={() => deactivate(a)} disabled={busyId === a.id} className="text-xs font-bold text-red-600 underline disabled:opacity-50">
                            Deactivate
                          </button>
                        ) : (
                          <button onClick={() => reactivate(a)} disabled={busyId === a.id} className="text-xs font-bold text-emerald-600 underline disabled:opacity-50">
                            Reactivate
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
