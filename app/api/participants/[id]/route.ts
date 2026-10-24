import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAction } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requireRole(request, [
    'REGISTRATION_ADMIN',
    'FINANCE_ADMIN',
    'ATTENDANCE_ADMIN',
    'HOUSE_ADMIN',
    'VIEWER',
    'ZONE_ADMIN',
  ]);
  if (error) return error;

  const participant = await prisma.participant.findUnique({
    where: { id: params.id },
    include: { class: true, house: true, payments: true, attendance: true },
  });
  if (!participant) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  if (admin.role !== 'SUPER_ADMIN' && admin.zone && participant.zone !== admin.zone) {
    return NextResponse.json({ error: 'Forbidden — outside your assigned zone.' }, { status: 403 });
  }

  return NextResponse.json({ participant });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requireRole(request, ['REGISTRATION_ADMIN']);
  if (error) return error;

  const existing = await prisma.participant.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (admin.role !== 'SUPER_ADMIN' && admin.zone && existing.zone !== admin.zone) {
    return NextResponse.json({ error: 'Forbidden — outside your assigned zone.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const allowed = ['surname', 'otherName', 'gender', 'ageGroup', 'email', 'phone', 'category', 'zone', 'healthChallenges', 'classId'];
  const data: Record<string, unknown> = {};
  for (const key of allowed) if (body[key] !== undefined) data[key] = body[key];

  const updated = await prisma.participant.update({ where: { id: params.id }, data });
  await logAction({ actorId: admin.id, action: 'UPDATE_PARTICIPANT', targetType: 'Participant', targetId: updated.id, before: existing, after: updated });

  return NextResponse.json({ success: true, participant: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requireRole(request, []);
  if (error) return error;
  if (admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only (this permanently deletes the record).' }, { status: 403 });
  }

  const existing = await prisma.participant.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  await prisma.$transaction([
    prisma.payment.deleteMany({ where: { participantId: params.id } }),
    prisma.attendance.deleteMany({ where: { participantId: params.id } }),
    prisma.participant.delete({ where: { id: params.id } }),
  ]);

  await logAction({ actorId: admin.id, action: 'DELETE_PARTICIPANT', targetType: 'Participant', targetId: params.id, before: existing });

  return NextResponse.json({ success: true });
}
