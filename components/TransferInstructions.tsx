'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Copy } from 'lucide-react';

export interface TransferDetails {
  transactionId: string;
  amount: number;
  account: { accountNumber: string; bankName: string; accountName: string };
}

const POLL_MS = 5000;

export default function TransferInstructions({ details, onPaid }: { details: TransferDetails; onPaid?: () => void }) {
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paid) return;
    let stopped = false;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/verify?ref=${encodeURIComponent(details.transactionId)}`);
        const data = await res.json();
        if (!stopped && data.status === 'VERIFIED') {
          setPaid(true);
          onPaid?.();
        }
      } catch {
        /* keep polling */
      }
    }, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [details.transactionId, paid, onPaid]);

  if (paid) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <CheckCircle className="h-8 w-8 text-emerald-600" />
        <p className="text-sm font-bold text-[#0F3D2E]">Payment received. Thank you!</p>
        <p className="text-xs text-slate-600">Your registration is updated and your hostel will be assigned shortly.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[#0F3D2E]/15 bg-white p-5 text-left">
      <p className="text-xs font-bold uppercase tracking-wide text-[#4A5D23]">Transfer exactly</p>
      <p className="text-2xl font-black text-[#0F3D2E]">₦{details.amount.toLocaleString()}</p>

      <div className="mt-3 space-y-1.5 text-xs text-slate-700">
        <div className="flex justify-between"><span>Bank</span><span className="font-bold">{details.account.bankName}</span></div>
        <div className="flex justify-between"><span>Account name</span><span className="font-bold">{details.account.accountName}</span></div>
        <div className="flex items-center justify-between">
          <span>Account number</span>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(details.account.accountNumber);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-1.5 font-mono text-sm font-black text-[#0F3D2E]"
          >
            {details.account.accountNumber}
            <Copy className="h-3.5 w-3.5" />
            {copied && <span className="text-[10px] font-semibold text-emerald-600">Copied</span>}
          </button>
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
        Send the exact amount from any bank app. This page updates by itself once the transfer arrives (usually within a minute).
      </p>
    </div>
  );
}
