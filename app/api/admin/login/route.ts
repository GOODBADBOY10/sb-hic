import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  // Same error for "no such admin" and "wrong password" — don't leak which
  // one it was.
  if (!admin || admin.status === 'DEACTIVATED') {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  const token = createSessionToken(admin.id);

  const res = NextResponse.json({
    success: true,
    admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, zone: admin.zone },
  });

  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 hours, matches the JWT expiry
  });

  return res;
}
