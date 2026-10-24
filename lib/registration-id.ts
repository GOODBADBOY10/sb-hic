import { prisma } from './prisma';

/**
 * Generates SB-{year}-{sequential}. There's a small race window under heavy
 * concurrent registration at this scale that's acceptable; if you later need
 * stronger guarantees, switch this to a Postgres sequence.
 */
export async function generateRegistrationId(programmeId: string, year: number) {
  const count = await prisma.participant.count({ where: { programmeId } });
  const next = (count + 1).toString().padStart(6, '0');
  return `SB-${year}-${next}`;
}
