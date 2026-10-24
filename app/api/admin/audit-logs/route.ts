import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { admin, error } = await requireRole(request, []);
  if (error) return error;
  if (admin.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden — Super Admin only.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const take = Math.min(Number(searchParams.get('limit')) || 100, 500);

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take,
  });

  return NextResponse.json({ logs });
}
