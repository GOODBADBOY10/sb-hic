import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAction } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { admin, error } = await requireRole(request, ['HOUSE_ADMIN']);
  if (error) return error;

  const existing = await prisma.house.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'House not found.' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { name, capacity, status } = body;
  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (capacity !== undefined) data.capacity = capacity;
  if (status) data.status = status;

  const updated = await prisma.house.update({ where: { id: params.id }, data });
  await logAction({ actorId: admin.id, action: 'UPDATE_HOUSE', targetType: 'House', targetId: updated.id, before: existing, after: updated });

  return NextResponse.json({ success: true, house: updated });
}
