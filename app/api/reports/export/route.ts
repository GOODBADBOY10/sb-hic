import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, zoneFilter } from '@/lib/auth';

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
}

export async function GET(request: NextRequest) {
  const { admin, error } = await requireRole(request, [
    'REGISTRATION_ADMIN',
    'FINANCE_ADMIN',
    'ATTENDANCE_ADMIN',
    'VIEWER',
    'ZONE_ADMIN',
  ]);
  if (error) return error;

  const type = new URL(request.url).searchParams.get('type') || 'registrations';

  let rows: Record<string, unknown>[] = [];

  if (type === 'registrations') {
    const participants = await prisma.participant.findMany({
      where: zoneFilter(admin),
      include: { class: true },
    });
    rows = participants.map((p) => ({
      registrationId: p.registrationId,
      name: `${p.otherName} ${p.surname}`,
      gender: p.gender,
      ageGroup: p.ageGroup,
      category: p.category,
      class: p.class?.name ?? '',
      zone: p.zone,
    }));
  } else if (type === 'payments') {
    const payments = await prisma.payment.findMany({ include: { participant: true } });
    rows = payments
      .filter((pay) => !admin.zone || admin.role === 'SUPER_ADMIN' || pay.participant.zone === admin.zone)
      .map((p) => ({
        registrationId: p.participant.registrationId,
        participant: `${p.participant.otherName} ${p.participant.surname}`,
        amount: p.amount,
        paymentType: p.paymentType,
        installmentNumber: p.installmentNumber ?? '',
        status: p.status,
        paidAt: p.paidAt?.toISOString() ?? '',
      }));
  } else if (type === 'attendance') {
    const participants = await prisma.participant.findMany({
      where: zoneFilter(admin),
      include: { class: true, house: true, attendance: true },
    });
    rows = participants.map((p) => ({
      registrationId: p.registrationId,
      name: `${p.otherName} ${p.surname}`,
      class: p.class?.name ?? '',
      house: p.house?.name ?? '',
      status: p.attendance?.status ?? 'NOT_ARRIVED',
      checkInTime: p.attendance?.checkInTime?.toISOString() ?? '',
    }));
  } else if (type === 'houses') {
    const houses = await prisma.house.findMany({ include: { _count: { select: { participants: true } } } });
    rows = houses.map((h) => ({
      house: h.name,
      gender: h.gender,
      capacity: h.capacity,
      occupants: h._count.participants,
      available: h.capacity - h._count.participants,
    }));
  } else {
    return NextResponse.json({ error: 'type must be registrations, payments, attendance, or houses.' }, { status: 400 });
  }

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}-export.csv"`,
    },
  });
}
