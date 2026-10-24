import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { admin, error } = await requireRole(request, ['FINANCE_ADMIN']);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const payments = await prisma.payment.findMany({
    where: {
      ...(status && { status: status as any }),
      ...(admin.role !== 'SUPER_ADMIN' && admin.zone ? { participant: { zone: admin.zone } } : {}),
    },
    include: { participant: { select: { registrationId: true, surname: true, otherName: true, zone: true } } },
    orderBy: { paidAt: 'desc' },
  });

  const collected = payments.filter((p) => p.status === 'VERIFIED').reduce((s, p) => s + p.amount, 0);

  return NextResponse.json({ payments, collected });
}
