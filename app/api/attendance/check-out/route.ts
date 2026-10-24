import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAction } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { admin, error } = await requireRole(request, ['ATTENDANCE_ADMIN']);
  if (error) return error;

  const { participantId } = await request.json().catch(() => ({}));
  if (!participantId) return NextResponse.json({ error: 'participantId is required.' }, { status: 400 });

  const existing = await prisma.attendance.findUnique({ where: { participantId } });
  if (!existing) return NextResponse.json({ error: 'Attendance record not found.' }, { status: 404 });

  const updated = await prisma.attendance.update({
    where: { participantId },
    data: { status: 'NOT_ARRIVED', checkInTime: null, checkedInBy: null },
  });
  await prisma.participant.update({ where: { id: participantId }, data: { attendanceStatus: 'NOT_ARRIVED' } });

  await logAction({
    actorId: admin.id,
    action: 'CHECK_OUT',
    targetType: 'Participant',
    targetId: participantId,
    before: { status: existing.status, checkInTime: existing.checkInTime },
    after: { status: 'NOT_ARRIVED' },
  });

  return NextResponse.json({ success: true, attendance: updated });
}
