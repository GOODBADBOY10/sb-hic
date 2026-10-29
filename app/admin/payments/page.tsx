'use client';

import { useEffect, useState } from 'react';

interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  paymentType: 'FULL' | 'INSTALLMENT';
  installmentNumber: number | null;
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
  paidAt: string | null;
  participant: { registrationId: string; surname: string; otherName: string; zone: string };
}

const statusColor: Record<string, string> = {
  VERIFIED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-200 text-slate-600',
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [collected, setCollected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    const res = await fetch(`/api/payments${params}`);
    if (res.status === 401) {
      window.location.href = '/admin/login';
      return;
    }
    const data = await res.json();
    if (res.ok) {
      setPayments(data.payments);
      setCollected(data.collected);
    } else {
      setError(data.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function approve(p: Payment) {
    const ok = window.confirm(
      `Approve ₦${p.amount.toLocaleString()} for ${p.participant.otherName} ${p.participant.surname} (${p.participant.registrationId})?\n\nOnly approve after you have seen the money in the bank account.`
    );
    if (!ok) return;
    setBusyId(p.transactionId);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: p.transactionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(`Approved. ${p.participant.registrationId} is now ${data.participantPaymentStatus.replace('_', ' ').toLowerCase()}.`);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function refund(transactionId: string) {
    const reason = window.prompt('Reason for refund (required, logged to audit trail):');
    if (!reason) return;
    setBusyId(transactionId);
    setMessage(null);
    try {
      const res = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage('Refund recorded.');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const q = search.trim().toLowerCase();
  const visible = q
    ? payments.filter((p) =>
        [p.participant.registrationId, p.participant.surname, p.participant.otherName, p.transactionId]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    : payments;

  return (
    <main className="min-h-screen bg-[#F7F3E8] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <a href="/admin/dashboard" className="text-xs text-[#4A5D23] underline">← Back to dashboard</a>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-black text-[#14170F]">Payments</h1>
          <a href="/api/reports/export?type=payments" className="rounded-full bg-[#0F3D2E] px-5 py-2.5 text-xs font-bold text-[#F7F3E8]">
            Export CSV
          </a>
        </div>

        <div className="mt-5 rounded-2xl border border-[#0F3D2E]/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4A5D23]">Total Collected (Verified)</p>
          <p className="mt-1 text-3xl font-black text-[#0F3D2E]">₦{collected.toLocaleString()}</p>
        </div>

        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          {['', 'PENDING', 'VERIFIED', 'FAILED', 'REFUNDED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-4 py-2 text-xs font-bold ${statusFilter === s ? 'bg-[#0F3D2E] text-[#F7F3E8]' : 'bg-white text-[#4B5347]'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Delegate ID, name or reference…"
          className="mt-4 w-full rounded-xl border border-[#0F3D2E]/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#0F3D2E]"
        />

        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#0F3D2E]/10 bg-white">
          {loading ? (
            <div className="flex justify-center p-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F3D2E]/15 border-t-[#0F3D2E]" />
            </div>
          ) : visible.length === 0 ? (
            <p className="p-6 text-sm text-[#4B5347]">No transactions match this filter.</p>
          ) : (
            <table className="w-full min-w-200 text-left text-sm">
              <thead>
                <tr className="border-b border-[#0F3D2E]/10 text-xs font-bold uppercase tracking-wide text-[#4A5D23]">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Participant</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-b border-[#0F3D2E]/5 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{p.transactionId}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{p.participant.otherName} {p.participant.surname}</p>
                      <p className="text-xs text-[#4B5347]">{p.participant.registrationId}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.paymentType === 'FULL' ? 'Full' : `Instalment ${p.installmentNumber}/10`}
                    </td>
                    <td className="px-4 py-3 font-semibold">₦{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#4B5347]">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      {p.status === 'PENDING' && (
                        <button onClick={() => approve(p)} disabled={busyId === p.transactionId} className="rounded-full bg-[#0F3D2E] px-3 py-1.5 text-xs font-bold text-[#F7F3E8] disabled:opacity-50">
                          Approve
                        </button>
                      )}
                      {p.status === 'VERIFIED' && (
                        <button onClick={() => refund(p.transactionId)} disabled={busyId === p.transactionId} className="text-xs font-bold text-red-600 underline disabled:opacity-50">
                          Refund
                        </button>
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
