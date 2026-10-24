import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, zoneFilter } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { admin, error } = await requireRole(request, [
    'REGISTRATION_ADMIN',
    'FINANCE_ADMIN',
    'ATTENDANCE_ADMIN',
    'HOUSE_ADMIN',
    'VIEWER',
    'ZONE_ADMIN',
  ]);
  if (error) return error;

  const where = zoneFilter(admin);

  const [totalRegistered, fullyPaid, partiallyPaid, notPaid, present] = await Promise.all([
    prisma.participant.count({ where }),
    prisma.participant.count({ where: { ...where, paymentStatus: 'FULLY_PAID' } }),
    prisma.participant.count({ where: { ...where, paymentStatus: 'PARTIALLY_PAID' } }),
    prisma.participant.count({ where: { ...where, paymentStatus: 'NOT_PAID' } }),
    prisma.participant.count({ where: { ...where, attendanceStatus: 'PRESENT' } }),
  ]);

  // "Expected at camp" = fully paid, since payment is mandatory for attendance.
  const expected = fullyPaid;
  const notYetArrived = expected - present;
  const attendancePercentage = expected > 0 ? Math.round((present / expected) * 100) : 0;

  return NextResponse.json({
    totalRegistered,
    fullyPaid,
    partiallyPaid,
    paymentPending: notPaid,
    expected,
    present,
    notYetArrived,
    attendancePercentage,
  });
}
