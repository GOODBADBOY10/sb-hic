import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAction } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { admin, error } = await requireRole(request, ['ATTENDANCE_ADMIN']);
  if (error) return error;

  const { participantId, reason } = await request.json().catch(() => ({}));
  if (!participantId || !reason) {
    return NextResponse.json({ error: 'participantId and reason are required.' }, { status: 400 });
  }

  const existing = await prisma.attendance.findUnique({ where: { participantId } });
  if (!existing || existing.status !== 'PRESENT') {
    return NextResponse.json({ error: 'This participant is not currently checked in.' }, { status: 400 });
  }

  const updated = await prisma.attendance.update({
    where: { participantId },
    data: { status: 'NOT_ARRIVED', checkInTime: null, checkedInBy: null, corrected: true, correctionReason: reason },
  });
  await prisma.participant.update({ where: { id: participantId }, data: { attendanceStatus: 'NOT_ARRIVED' } });

  await logAction({
    actorId: admin.id,
    action: 'CORRECT_ATTENDANCE',
    targetType: 'Participant',
    targetId: participantId,
    before: { status: 'PRESENT', checkInTime: existing.checkInTime, checkedInBy: existing.checkedInBy },
    after: { status: 'NOT_ARRIVED', reason },
  });

  return NextResponse.json({ success: true, attendance: updated });
}
