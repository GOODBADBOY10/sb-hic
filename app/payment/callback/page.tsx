'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Phase = 'polling' | 'verified' | 'failed' | 'timeout' | 'error';

interface VerifyResult {
  status: 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
  amount: number;
  paymentType: 'FULL' | 'INSTALLMENT';
  installmentNumber: number | null;
  participant: {
    id: string;
    registrationId: string;
    name: string;
    class: string | null;
    paymentStatus: string;
    totalOwed: number;
  };
}

const MAX_ATTEMPTS = 20; // ~40s of polling at 2s intervals
const POLL_INTERVAL_MS = 2000;

function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const [phase, setPhase] = useState<Phase>('polling');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!reference) {
      setPhase('error');
      setError('No payment reference was returned — please contact support with your registration ID.');
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/payments/verify?ref=${encodeURIComponent(reference!)}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setPhase('error');
          setError(data.error || 'Could not look up this payment.');
          return;
        }

        if (data.status === 'VERIFIED') {
          setResult(data);
          setPhase('verified');
          return;
        }
        if (data.status === 'FAILED') {
          setResult(data);
          setPhase('failed');
          return;
        }

        // Still PENDING — the webhook may not have landed yet. Keep polling.
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setResult(data);
          setPhase('timeout');
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) {
          setPhase('error');
          setError('Something went wrong while checking your payment.');
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  async function retryPayment() {
    if (!result) return;
    setRetrying(true);
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: result.participant.id,
          paymentType: result.paymentType,
          installmentNumber: result.installmentNumber ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not restart payment.');
      window.location.href = data.checkoutUrl;
    } catch (e: any) {
      setError(e.message);
      setRetrying(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8] px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-[#0F3D2E]/10 bg-white p-8 text-center shadow-sm">
        {phase === 'polling' && (
          <>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-[#0F3D2E]/15 border-t-[#0F3D2E]" />
            <h1 className="text-xl font-black text-[#14170F]">Confirming your payment…</h1>
            <p className="mt-2 text-sm text-[#4B5347]">
              This usually takes a few seconds. Please don&apos;t close this page.
            </p>
          </>
        )}

        {phase === 'verified' && result && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8B923] text-2xl">
              ✓
            </div>
            <p className="text-sm font-semibold text-[#4A5D23]">Payment Confirmed</p>
            <h1 className="mt-1 text-2xl font-black text-[#14170F]">
              You&apos;re all set, {result.participant.name.split(' ')[0]}
            </h1>

            <div className="mt-6 space-y-2.5 rounded-2xl bg-[#F7F3E8] p-5 text-left text-sm">
              <div className="flex justify-between"><span className="text-[#4B5347]">Registration ID</span><span className="font-bold">{result.participant.registrationId}</span></div>
              <div className="flex justify-between"><span className="text-[#4B5347]">Class</span><span className="font-bold text-[#0F3D2E]">{result.participant.class}</span></div>
              <div className="flex justify-between"><span className="text-[#4B5347]">Amount Paid</span><span className="font-bold">₦{result.amount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[#4B5347]">Payment Status</span><span className="font-bold">{result.participant.paymentStatus.replace('_', ' ')}</span></div>
            </div>

            {result.participant.paymentStatus === 'PARTIALLY_PAID' && (
              <p className="mt-4 text-xs text-[#4B5347]">
                This instalment is confirmed — return anytime to pay the next one before 30 November.
              </p>
            )}

            <a
              href={`/dashboard?participantId=${result.participant.id}`}
              className="mt-6 block rounded-full bg-[#0F3D2E] px-6 py-3.5 text-sm font-bold text-[#F7F3E8]"
            >
              View My Registration
            </a>
          </>
        )}

        {phase === 'failed' && result && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">✕</div>
            <h1 className="text-xl font-black text-[#14170F]">Payment didn&apos;t go through</h1>
            <p className="mt-2 text-sm text-[#4B5347]">
              Paystack reported this transaction as unsuccessful. No charge was completed — you can try again below.
            </p>
            <button
              onClick={retryPayment}
              disabled={retrying}
              className="mt-6 w-full rounded-full bg-[#E8B923] px-6 py-3.5 text-sm font-bold text-[#0A2A20] disabled:opacity-50"
            >
              {retrying ? 'Redirecting…' : 'Try Payment Again'}
            </button>
          </>
        )}

        {phase === 'timeout' && result && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">⏳</div>
            <h1 className="text-xl font-black text-[#14170F]">Still confirming…</h1>
            <p className="mt-2 text-sm text-[#4B5347]">
              This is taking longer than usual. Your payment may still be processing on Paystack&apos;s side — check back
              on your registration shortly, or contact support with reference <span className="font-mono font-semibold">{reference}</span> if this persists.
            </p>
            <a
              href={`/dashboard?participantId=${result.participant.id}`}
              className="mt-6 block rounded-full border border-[#0F3D2E]/20 px-6 py-3.5 text-sm font-semibold text-[#0F3D2E]"
            >
              Check My Registration
            </a>
          </>
        )}

        {phase === 'error' && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">⚠</div>
            <h1 className="text-xl font-black text-[#14170F]">Couldn&apos;t confirm this payment</h1>
            <p className="mt-2 text-sm text-[#4B5347]">{error}</p>
          </>
        )}
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F7F3E8]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F3D2E]/15 border-t-[#0F3D2E]" />
        </main>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}