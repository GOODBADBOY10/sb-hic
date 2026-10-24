import { prisma } from './prisma';

export async function getEligibleHouses(programmeId: string, gender: 'MALE' | 'FEMALE') {
  const houses = await prisma.house.findMany({
    where: { programmeId, gender, status: 'ACTIVE' },
    include: { _count: { select: { participants: true } } },
  });
  return houses
    .map((h) => ({ ...h, occupants: h._count.participants, available: h.capacity - h._count.participants }))
    .filter((h) => h.available > 0);
}
