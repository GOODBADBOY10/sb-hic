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

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const gender = searchParams.get('gender');
  const zone = searchParams.get('zone');
  const category = searchParams.get('category');
  const paymentStatus = searchParams.get('paymentStatus');
  const attendanceStatus = searchParams.get('attendanceStatus');

  const participants = await prisma.participant.findMany({
    where: {
      ...zoneFilter(admin),
      ...(classId && { classId }),
      ...(gender && { gender: gender as any }),
      ...(zone && { zone }),
      ...(category && { category }),
      ...(paymentStatus && { paymentStatus: paymentStatus as any }),
      ...(attendanceStatus && { attendanceStatus: attendanceStatus as any }),
    },
    include: { class: true, house: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ participants });
}
