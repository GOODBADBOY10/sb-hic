import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { admin, error } = await requireRole(request, [
    'REGISTRATION_ADMIN',
    'FINANCE_ADMIN',
    'ATTENDANCE_ADMIN',
    'HOUSE_ADMIN',
    'VIEWER',
    'ZONE_ADMIN',
  ]);
  if (error) return error;

  return NextResponse.json({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    zone: admin.zone,
  });
}
