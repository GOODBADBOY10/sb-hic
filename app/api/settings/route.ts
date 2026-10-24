import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAction } from '@/lib/auth';

export async function GET() {
  const programme = await prisma.programme.findFirst({ orderBy: { year: 'desc' } });
  if (!programme) return NextResponse.json({ error: 'No programme configured.' }, { status: 404 });
  return NextResponse.json({ programme });
}

export async function PATCH(request: NextRequest) {
  const { admin, error } = await requireRole(request, []);
  if (error) return error;
  if (admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only.' }, { status: 403 });
  }

  const programme = await prisma.programme.findFirst({ orderBy: { year: 'desc' } });
  if (!programme) return NextResponse.json({ error: 'No programme configured.' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const allowed = [
    'earlyBirdFee',
    'flatFee',
    'earlyBirdDeadline',
    'defaultHouseCapacity',
    'registrationOpen',
    'venueName',
    'venueAddress',
    'campStart',
    'campEnd',
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) if (body[key] !== undefined) data[key] = body[key];

  const updated = await prisma.programme.update({ where: { id: programme.id }, data });
  await logAction({ actorId: admin.id, action: 'UPDATE_SETTINGS', targetType: 'Programme', targetId: programme.id, before: programme, after: updated });

  return NextResponse.json({ success: true, programme: updated });
}
