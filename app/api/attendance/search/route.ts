import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { error } = await requireRole(request, ['ATTENDANCE_ADMIN']);
  if (error) return error;

  const q = new URL(request.url).searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ error: 'q (search query) is required.' }, { status: 400 });

  const participants = await prisma.participant.findMany({
    where: {
      OR: [
        { registrationId: { equals: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { surname: { contains: q, mode: 'insensitive' } },
        { otherName: { contains: q, mode: 'insensitive' } },
      ],
    },
    include: { class: true, house: true, attendance: true },
    take: 10,
  });

  return NextResponse.json({ participants });
}
