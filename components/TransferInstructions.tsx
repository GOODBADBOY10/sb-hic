'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Copy, MessageCircle } from 'lucide-react';

export interface TransferDetails {
  transactionId: string;
  amount: number;
  account: { accountNumber: string; bankName: string; accountName: string };
  /** Present in manual mode: digits-only international number for wa.me */
  whatsapp?: string | null;
  registrationId?: string;
  name?: string;
  label?: string;
}

const POLL_MS = 15000;
const POLL_MAX = 120; // stop checking after about 30 minutes

export default function TransferInstructions({ details, onPaid }: { details: TransferDetails; onPaid?: () => void }) {
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paid) return;
    let stopped = false;
    let tries = 0;
    const id = setInterval(async () => {
      if (++tries > POLL_MAX) {
        clearInterval(id);
        return;
      }
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
        <p className="text-sm font-bold text-[#0F3D2E]">Payment confirmed. Thank you!</p>
        <p className="text-xs text-slate-600">Your registration is updated and your hostel will be assigned shortly.</p>
      </div>
    );
  }

  const manual = !!details.whatsapp;
  const message = [
    'Assalamu Alaykum. I have paid for SB HIC 2026.',
    details.name ? `Name: ${details.name}` : null,
    details.registrationId ? `Delegate ID: ${details.registrationId}` : null,
    `Payment: ${details.label ?? 'Camp fee'} (₦${details.amount.toLocaleString()})`,
    `Reference: ${details.transactionId}`,
    'My receipt is attached.',
  ]
    .filter(Boolean)
    .join('\n');
  const whatsappUrl = manual ? `https://wa.me/${details.whatsapp}?text=${encodeURIComponent(message)}` : null;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[#0F3D2E]/15 bg-white p-5 text-left">
      <p className="text-xs font-bold uppercase tracking-wide text-[#4A5D23]">
        {details.label ? `${details.label} — transfer exactly` : 'Transfer exactly'}
      </p>
      <p className="text-2xl font-black text-[#0F3D2E]">₦{details.amount.toLocaleString()}</p>

      <div className="mt-3 space-y-1.5 text-xs text-slate-700">
        <div className="flex justify-between"><span>Bank</span><span className="font-bold">{details.account.bankName}</span></div>
        <div className="flex justify-between gap-3"><span>Account name</span><span className="text-right font-bold">{details.account.accountName}</span></div>
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

      {manual ? (
        <>
          <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-[11px] font-medium text-slate-700">
            <li>
              Transfer the exact amount.
              {details.registrationId && <> Put your Delegate ID <b>{details.registrationId}</b> in the transfer description.</>}
            </li>
            <li>Take a screenshot of the receipt.</li>
            <li>Send it to us on WhatsApp using the button below, and attach the screenshot.</li>
          </ol>
          <a
            href={whatsappUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-black text-white shadow"
          >
            <MessageCircle className="h-4 w-4" />
            Send receipt on WhatsApp
          </a>
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
            An admin confirms your payment once the money is seen in our account. Keep this Delegate ID safe; your status updates on your dashboard after approval.
          </p>
        </>
      ) : (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
          Send the exact amount from any bank app. This page updates by itself once the transfer arrives (usually within a minute).
        </p>
      )}
    </div>
  );
}
