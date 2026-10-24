import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAction } from '@/lib/auth';
import { getEligibleHouses } from '@/lib/houses';

export async function POST(request: NextRequest) {
  const { admin, error } = await requireRole(request, ['HOUSE_ADMIN']);
  if (error) return error;

  const { programmeId } = await request.json().catch(() => ({}));
  const programme = programmeId
    ? await prisma.programme.findUnique({ where: { id: programmeId } })
    : await prisma.programme.findFirst({ orderBy: { year: 'desc' } });
  if (!programme) return NextResponse.json({ error: 'Programme not found.' }, { status: 404 });

  // Only participants who are fully paid AND don't already have a house.
  const unassigned = await prisma.participant.findMany({
    where: { programmeId: programme.id, paymentStatus: 'FULLY_PAID', houseId: null },
  });

  const results: { participantId: string; houseId: string | null }[] = [];

  for (const gender of ['MALE', 'FEMALE'] as const) {
    const pool = unassigned.filter((p) => p.gender === gender);
    if (!pool.length) continue;

    const eligible = await getEligibleHouses(programme.id, gender);
    let cursor = 0;

    for (const participant of pool) {
      // Find the next house in rotation that still has space, skipping any
      // that filled up mid-batch.
      let assignedHouseId: string | null = null;
      for (let attempt = 0; attempt < eligible.length; attempt++) {
        const candidate = eligible[(cursor + attempt) % eligible.length];
        if (candidate.available > 0) {
          assignedHouseId = candidate.id;
          candidate.available -= 1;
          cursor = (cursor + attempt + 1) % eligible.length;
          break;
        }
      }

      if (assignedHouseId) {
        await prisma.participant.update({ where: { id: participant.id }, data: { houseId: assignedHouseId } });
      }
      results.push({ participantId: participant.id, houseId: assignedHouseId });
    }
  }

  const unassignedCount = results.filter((r) => !r.houseId).length;

  await logAction({
    actorId: admin.id,
    action: 'AUTO_ASSIGN_HOUSES',
    targetType: 'Programme',
    targetId: programme.id,
    after: { assigned: results.length - unassignedCount, unassigned: unassignedCount },
  });

  return NextResponse.json({
    success: true,
    assigned: results.length - unassignedCount,
    unassigned: unassignedCount,
    details: results,
  });
}
