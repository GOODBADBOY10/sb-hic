'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TransferInstructions, { type TransferDetails } from '@/components/TransferInstructions';

interface Registration {
  registrationId: string;
  name: string;
  gender: string;
  zone: string;
  class: string | null;
  house: string | null;
  paymentStatus: string;
  attendanceStatus: string;
  totalOwed: number;
  totalPaid: number;
  balance: number;
  payments: {
    installmentNumber: number | null;
    paymentType: 'FULL' | 'INSTALLMENT';
    amount: number;
    status: string;
    paidAt: string | null;
  }[];
}

const statusColor: Record<string, string> = {
  FULLY_PAID: 'bg-emerald-100 text-emerald-700',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
  NOT_PAID: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-200 text-slate-600',
};

function DashboardContent() {
  const participantId = useSearchParams().get('participantId');
  const [data, setData] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingNow, setPayingNow] = useState(false);
  const [choosingPlan, setChoosingPlan] = useState(false);
  const [transfer, setTransfer] = useState<TransferDetails | null>(null);

  async function load() {
    if (!participantId) {
      setError('No registration specified.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/registrations/${participantId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not load this registration.');
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId]);

  async function pay(paymentType: 'FULL' | 'INSTALLMENT') {
    if (!participantId || !data) return;
    setPayingNow(true);
    try {
      const nextInstallment =
        paymentType === 'INSTALLMENT'
          ? (data.payments.filter((p) => p.paymentType === 'INSTALLMENT' && p.status === 'VERIFIED').length || 0) + 1
          : undefined;

      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, paymentType, installmentNumber: nextInstallment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not start payment.');
      setTransfer({
        transactionId: json.transactionId,
        amount: json.amount,
        account: json.account,
        whatsapp: json.whatsapp,
        registrationId: json.registrationId,
        name: json.name,
        label: json.label,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPayingNow(false);
    }
  }

  const hasStartedInstallments = data?.payments.some((p) => p.paymentType === 'INSTALLMENT');
  const nextInstallmentNumber = hasStartedInstallments
    ? (data!.payments.filter((p) => p.paymentType === 'INSTALLMENT' && p.status === 'VERIFIED').length || 0) + 1
    : null;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F3D2E]/15 border-t-[#0F3D2E]" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8] px-6">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error || 'Registration not found.'}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3E8] px-6 py-14">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-[#4A5D23]">SB HIC 2026</p>
        <h1 className="mt-1 text-3xl font-black text-[#14170F]">{data.name}</h1>
        <p className="mt-1 text-sm text-[#4B5347]">Registration ID: {data.registrationId}</p>

        {/* Overview */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ['Class', data.class ?? '—'],
            ['Gender', data.gender === 'MALE' ? 'Male' : 'Female'],
            ['Zone', data.zone],
            ['House', data.house ?? 'Pending payment'],
            ['Attendance', data.attendanceStatus === 'PRESENT' ? 'Checked in' : 'Not yet arrived'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#0F3D2E]/10 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A5D23]">{label}</p>
              <p className="mt-1 text-sm font-bold text-[#14170F]">{value}</p>
            </div>
          ))}
        </section>

        {/* Payment */}
        <section className="mt-6 rounded-3xl border border-[#0F3D2E]/10 bg-white p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Payment</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor[data.paymentStatus] ?? 'bg-slate-100 text-slate-600'}`}>
              {data.paymentStatus.replace('_', ' ')}
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#4B5347]">Total Owed</span><span className="font-bold">₦{data.totalOwed.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[#4B5347]">Paid So Far</span><span className="font-bold text-[#0F3D2E]">₦{data.totalPaid.toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-[#0F3D2E]/10 pt-2"><span className="text-[#4B5347]">Balance</span><span className="font-bold text-[#0A2A20]">₦{data.balance.toLocaleString()}</span></div>
          </div>

          {data.payments.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4A5D23]">Payment History</p>
              {data.payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-[#F7F3E8] px-3.5 py-2.5 text-xs">
                  <span className="font-semibold">
                    {p.paymentType === 'FULL' ? 'Full Payment' : `Instalment ${p.installmentNumber}/10`}
                  </span>
                  <span className="font-mono">₦{p.amount.toLocaleString()}</span>
                  <span className={`rounded-full px-2 py-0.5 font-bold ${p.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : p.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {transfer && (
            <div className="mt-6 flex justify-center">
              <TransferInstructions details={transfer} onPaid={() => { setTransfer(null); load(); }} />
            </div>
          )}

          {data.balance > 0 && !transfer && (
            <div className="mt-6">
              {hasStartedInstallments ? (
                <button
                  onClick={() => pay('INSTALLMENT')}
                  disabled={payingNow}
                  className="w-full rounded-full bg-[#E8B923] px-6 py-3.5 text-sm font-bold text-[#0A2A20] disabled:opacity-50"
                >
                  {payingNow ? 'Getting account details…' : `Pay Instalment ${nextInstallmentNumber}/10`}
                </button>
              ) : choosingPlan ? (
                <div className="flex gap-3">
                  <button onClick={() => pay('FULL')} disabled={payingNow} className="flex-1 rounded-full bg-[#0F3D2E] px-4 py-3.5 text-sm font-bold text-[#F7F3E8] disabled:opacity-50">
                    Pay in Full
                  </button>
                  <button onClick={() => pay('INSTALLMENT')} disabled={payingNow} className="flex-1 rounded-full bg-[#E8B923] px-4 py-3.5 text-sm font-bold text-[#0A2A20] disabled:opacity-50">
                    Start Instalments
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setChoosingPlan(true)}
                  className="w-full rounded-full bg-[#E8B923] px-6 py-3.5 text-sm font-bold text-[#0A2A20]"
                >
                  Pay Outstanding Balance
                </button>
              )}
            </div>
          )}
        </section>

        {/* Camp info */}
        <section className="mt-6 rounded-3xl border border-[#0F3D2E]/10 bg-[#0F3D2E] p-7 text-[#F7F3E8]">
          <h2 className="text-lg font-extrabold">Camp Information</h2>
          <div className="mt-4 space-y-2 text-sm text-[#C9D6C4]">
            <p><span className="font-semibold text-[#E8B923]">Class:</span> {data.class ?? 'Pending'}</p>
            <p><span className="font-semibold text-[#E8B923]">House:</span> {data.house ?? 'Assigned after payment is confirmed'}</p>
            <p><span className="font-semibold text-[#E8B923]">Venue:</span> Oduduwa College, Ile-Ife</p>
          </div>
          <p className="mt-4 text-xs text-[#C9D6C4]">
            Bring your registration ID at arrival for check-in. Payment must be completed before you can be checked in.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F3D2E]/15 border-t-[#0F3D2E]" />
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
