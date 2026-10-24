import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAction } from '@/lib/auth';

export async function GET() {
  const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ classes });
}

export async function PATCH(request: NextRequest) {
  const { admin, error } = await requireRole(request, []);
  if (error) return error;
  if (admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only.' }, { status: 403 });
  }

  const { id, name, eligibleCategories } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Class not found.' }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (eligibleCategories) data.eligibleCategories = eligibleCategories;

  const updated = await prisma.class.update({ where: { id }, data });
  await logAction({ actorId: admin.id, action: 'UPDATE_CLASS', targetType: 'Class', targetId: id, before: existing, after: updated });

  return NextResponse.json({ success: true, class: updated });
}
