import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, hashPassword, logAction } from '@/lib/auth';

const SAFE_FIELDS = { id: true, name: true, email: true, role: true, zone: true, status: true, isProtected: true, createdAt: true };

export async function GET(request: NextRequest) {
  const { admin, error } = await requireRole(request, []); // Super Admin only (requireRole lets SUPER_ADMIN through regardless)
  if (error) return error;
  if (admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only.' }, { status: 403 });
  }

  const admins = await prisma.adminUser.findMany({ select: SAFE_FIELDS, orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ admins }); // passwordHash is never selected, so it can never leak here
}

export async function POST(request: NextRequest) {
  const { admin, error } = await requireRole(request, []);
  if (error) return error;
  if (admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { name, email, password, role, zone } = body || {};

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'name, email, password, and role are required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'An admin with this email already exists.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const created = await prisma.adminUser.create({
    data: { name, email: email.toLowerCase(), passwordHash, role, zone: zone || null },
    select: SAFE_FIELDS,
  });

  await logAction({ actorId: admin.id, action: 'CREATE_ADMIN', targetType: 'AdminUser', targetId: created.id, after: created });

  return NextResponse.json({ success: true, admin: created }, { status: 201 });
}
