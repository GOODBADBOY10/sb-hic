import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

export const SESSION_COOKIE_NAME = 'sb_hic_session';
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  // Loud warning rather than a silent insecure fallback — sessions simply
  // won't work until this is set, which is the safe failure mode.
  console.warn(
    'SESSION_SECRET is not set. Admin login will fail until you set it in .env.'
  );
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(adminId: string) {
  if (!SESSION_SECRET) throw new Error('SESSION_SECRET is not configured.');
  return jwt.sign({ adminId }, SESSION_SECRET, { expiresIn: '12h' });
}

function readSession(request: NextRequest): { adminId: string } | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token || !SESSION_SECRET) return null;
  try {
    return jwt.verify(token, SESSION_SECRET) as { adminId: string };
  } catch {
    return null;
  }
}

type RequireRoleResult =
  | { admin: NonNullable<Awaited<ReturnType<typeof prisma.adminUser.findUnique>>>; error?: undefined }
  | { admin?: undefined; error: NextResponse };

/**
 * Verifies the signed session cookie against the database (never trusts a
 * client-supplied header or email) and checks the caller's role.
 * SUPER_ADMIN always passes, regardless of the allowedRoles list.
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<RequireRoleResult> {
  const session = readSession(request);
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized — please log in.' }, { status: 401 }) };
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: session.adminId } });
  if (!admin || admin.status === 'DEACTIVATED') {
    return { error: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) };
  }

  if (admin.role !== 'SUPER_ADMIN' && !allowedRoles.includes(admin.role)) {
    return { error: NextResponse.json({ error: 'Forbidden — insufficient permissions.' }, { status: 403 }) };
  }

  return { admin };
}

/** Builds a WHERE filter fragment that scopes a query to the admin's zone,
 * unless they're Super Admin or otherwise zone-unscoped. */
export function zoneFilter(admin: { role: string; zone: string | null }) {
  if (admin.role === 'SUPER_ADMIN' || !admin.zone) return {};
  return { zone: admin.zone };
}

export function logAction(params: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      before: params.before as any,
      after: params.after as any,
    },
  });
}
