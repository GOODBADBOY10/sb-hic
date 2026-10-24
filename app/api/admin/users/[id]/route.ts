import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, hashPassword, logAction } from '@/lib/auth';

const SAFE_FIELDS = { id: true, name: true, email: true, role: true, zone: true, status: true, isProtected: true, createdAt: true };

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin, error } = await requireRole(request, []);
  if (error) return error;
  if (admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only.' }, { status: 403 });
  }

  const target = await prisma.adminUser.findUnique({ where: { id: id } });
  if (!target) return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const { name, role, zone, status, password } = body || {};

  if (target.isProtected && (role || status === 'DEACTIVATED')) {
    return NextResponse.json(
      { error: 'This Super Admin account is protected and cannot be demoted or deactivated.' },
      { status: 403 }
    );
  }

  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (role) data.role = role;
  if (zone !== undefined) data.zone = zone || null;
  if (status) data.status = status;
  if (password) {
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    data.passwordHash = await hashPassword(password);
  }

  const updated = await prisma.adminUser.update({ where: { id: id }, data, select: SAFE_FIELDS });
  await logAction({ actorId: admin.id, action: 'UPDATE_ADMIN', targetType: 'AdminUser', targetId: updated.id, before: target, after: updated });

  return NextResponse.json({ success: true, admin: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin, error } = await requireRole(request, []);
  if (error) return error;
  if (admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only.' }, { status: 403 });
  }

  const target = await prisma.adminUser.findUnique({ where: { id: id } });
  if (!target) return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });
  if (target.isProtected) {
    return NextResponse.json({ error: 'This Super Admin account is protected and cannot be removed.' }, { status: 403 });
  }

  // Soft-deactivate rather than hard delete, so the audit trail stays intact.
  const updated = await prisma.adminUser.update({ where: { id: id }, data: { status: 'DEACTIVATED' }, select: SAFE_FIELDS });
  await logAction({ actorId: admin.id, action: 'DEACTIVATE_ADMIN', targetType: 'AdminUser', targetId: updated.id, before: target, after: updated });

  return NextResponse.json({ success: true, admin: updated });
}
