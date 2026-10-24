import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAction } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { admin, error } = await requireRole(request, ['ATTENDANCE_ADMIN']);
  if (error) return error;

  const { participantId } = await request.json().catch(() => ({}));
  if (!participantId) return NextResponse.json({ error: 'participantId is required.' }, { status: 400 });

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { attendance: true },
  });
  if (!participant) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });

  // Hard gate — payment is mandatory before attendance, enforced here, not
  // left to gate staff to enforce manually.
  if (participant.paymentStatus !== 'FULLY_PAID') {
    return NextResponse.json(
      { error: 'This participant has not completed payment and cannot be checked in.', paymentStatus: participant.paymentStatus },
      { status: 403 }
    );
  }

  if (participant.attendance?.status === 'PRESENT') {
    return NextResponse.json({
      error: 'Already checked in.',
      checkInTime: participant.attendance.checkInTime,
      checkedInBy: participant.attendance.checkedInBy,
    }, { status: 409 });
  }

  const updated = await prisma.attendance.upsert({
    where: { participantId },
    update: { status: 'PRESENT', checkInTime: new Date(), checkedInBy: admin.id },
    create: { participantId, status: 'PRESENT', checkInTime: new Date(), checkedInBy: admin.id },
  });

  await prisma.participant.update({ where: { id: participantId }, data: { attendanceStatus: 'PRESENT' } });

  await logAction({
    actorId: admin.id,
    action: 'CHECK_IN',
    targetType: 'Participant',
    targetId: participantId,
    after: { checkInTime: updated.checkInTime },
  });

  // Live counts for the dashboard.
  const [expected, present] = await Promise.all([
    prisma.participant.count({ where: { programmeId: participant.programmeId, paymentStatus: 'FULLY_PAID' } }),
    prisma.participant.count({ where: { programmeId: participant.programmeId, attendanceStatus: 'PRESENT' } }),
  ]);

  return NextResponse.json({ success: true, checkInTime: updated.checkInTime, expected, present });
}
