import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = await prisma.participant.findUnique({
    where: { id: id },
    include: {
      class: true,
      house: true,
      payments: { orderBy: { installmentNumber: 'asc' } },
      attendance: true,
      programme: true,
    },
  });

  if (!participant) return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });

  const totalOwed =
    participant.payments[0]?.planRate === 'FLAT' ? participant.programme.flatFee : participant.programme.earlyBirdFee;
  const totalPaid = participant.payments
    .filter((p) => p.status === 'VERIFIED')
    .reduce((sum, p) => sum + p.amount, 0);

  return NextResponse.json({
    registrationId: participant.registrationId,
    name: `${participant.otherName} ${participant.surname}`,
    gender: participant.gender,
    zone: participant.zone,
    class: participant.class?.name ?? null,
    house: participant.house?.name ?? null,
    paymentStatus: participant.paymentStatus,
    attendanceStatus: participant.attendanceStatus,
    totalOwed,
    totalPaid,
    balance: Math.max(0, totalOwed - totalPaid),
    payments: participant.payments.map((p) => ({
      installmentNumber: p.installmentNumber,
      paymentType: p.paymentType,
      amount: p.amount,
      status: p.status,
      paidAt: p.paidAt,
    })),
  });
}
