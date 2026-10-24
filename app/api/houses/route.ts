import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAction } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireRole(request, [
    'HOUSE_ADMIN',
    'REGISTRATION_ADMIN',
    'ATTENDANCE_ADMIN',
    'FINANCE_ADMIN',
    'VIEWER',
    'ZONE_ADMIN',
  ]);
  if (error) return error;

  const houses = await prisma.house.findMany({
    include: { _count: { select: { participants: true } } },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({
    houses: houses.map((h) => ({
      id: h.id,
      name: h.name,
      gender: h.gender,
      capacity: h.capacity,
      status: h.status,
      occupants: h._count.participants,
      available: h.capacity - h._count.participants,
    })),
  });
}

export async function POST(request: NextRequest) {
  const { admin, error } = await requireRole(request, ['HOUSE_ADMIN']);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const { name, gender, capacity } = body;
  if (!name || !gender) return NextResponse.json({ error: 'name and gender are required.' }, { status: 400 });

  const programme = await prisma.programme.findFirst({ orderBy: { year: 'desc' } });
  if (!programme) return NextResponse.json({ error: 'No active programme configured.' }, { status: 500 });

  const house = await prisma.house.create({
    data: {
      programmeId: programme.id,
      name,
      gender,
      capacity: capacity ?? programme.defaultHouseCapacity, // 40 by default
    },
  });

  await logAction({ actorId: admin.id, action: 'CREATE_HOUSE', targetType: 'House', targetId: house.id, after: house });

  return NextResponse.json({ success: true, house }, { status: 201 });
}
