import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireRole, logAction } from '@/lib/auth';
import { computeFee } from '@/lib/payments';

export async function POST(request: NextRequest) {
  const { admin, error } = await requireRole(request, ['FINANCE_ADMIN']);
  if (error) return error;

  const { participantId, reason } = await request.json().catch(() => ({}));
  if (!participantId || !reason) {
    return NextResponse.json({ error: 'participantId and reason are required.' }, { status: 400 });
  }

  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });

  const programme = await prisma.programme.findUnique({ where: { id: participant.programmeId } });
  if (!programme) return NextResponse.json({ error: 'Programme not found.' }, { status: 500 });

  // Uses whatever is actually owed right now (early-bird or flat), not a
  // hardcoded figure — this is the fix for the original bug where manual
  // approvals always recorded ₦8,500 regardless of the real fee.
  const fee = computeFee(programme, 'FULL');
  const transactionId = `MANUAL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        participantId,
        transactionId,
        amount: fee.amount,
        paymentType: 'FULL',
        planRate: fee.planRate,
        provider: 'manual_admin_override',
        status: 'VERIFIED',
        paidAt: new Date(),
        verifiedAt: new Date(),
      },
    });
    await tx.participant.update({ where: { id: participantId }, data: { paymentStatus: 'FULLY_PAID' } });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'MANUAL_PAYMENT_APPROVAL',
        targetType: 'Participant',
        targetId: participantId,
        before: { paymentStatus: participant.paymentStatus },
        after: { paymentStatus: 'FULLY_PAID', amount: fee.amount, reason },
      },
    });
  });

  return NextResponse.json({ success: true, transactionId, amount: fee.amount });
}
