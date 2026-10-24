import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, logAction } from '@/lib/auth';
import { getEligibleHouses } from '@/lib/houses';

export async function POST(request: NextRequest) {
  const { admin, error } = await requireRole(request, ['HOUSE_ADMIN']);
  if (error) return error;

  const { participantId, houseId } = await request.json().catch(() => ({}));
  if (!participantId || !houseId) {
    return NextResponse.json({ error: 'participantId and houseId are required.' }, { status: 400 });
  }

  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant) return NextResponse.json({ error: 'Participant not found.' }, { status: 404 });

  const eligible = await getEligibleHouses(participant.programmeId, participant.gender);
  const house = eligible.find((h) => h.id === houseId);
  if (!house) {
    return NextResponse.json(
      { error: 'That house is not eligible for this participant (wrong gender or at capacity).' },
      { status: 400 }
    );
  }

  const updated = await prisma.participant.update({ where: { id: participantId }, data: { houseId } });
  await logAction({
    actorId: admin.id,
    action: 'ASSIGN_HOUSE',
    targetType: 'Participant',
    targetId: participantId,
    before: { houseId: participant.houseId },
    after: { houseId },
  });

  return NextResponse.json({ success: true, participant: updated });
}
