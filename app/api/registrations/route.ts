import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRegistrationId } from '@/lib/registration-id';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const {
    surname,
    otherName,
    gender,
    ageGroup,
    email,
    phone,
    category,
    zone,
    healthChallenges,
    isMinor,
    guardianName,
    guardianContact,
  } = body;

  const required = { surname, otherName, gender, ageGroup, email, phone, category, zone };
  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
  }

  if (isMinor && (!guardianName || !guardianContact)) {
    return NextResponse.json(
      { error: 'Guardian name and contact are required for participants under 18.' },
      { status: 400 }
    );
  }

  const programme = await prisma.programme.findFirst({ orderBy: { year: 'desc' }, include: { classes: true } });
  if (!programme) return NextResponse.json({ error: 'No active programme is configured.' }, { status: 500 });
  if (!programme.registrationOpen) {
    return NextResponse.json({ error: 'Registration is currently closed.' }, { status: 403 });
  }

  const matchedClass = programme.classes.find((c) => c.eligibleCategories.includes(category));
  if (!matchedClass) {
    return NextResponse.json({ error: `No class is configured for category "${category}".` }, { status: 400 });
  }

  const registrationId = await generateRegistrationId(programme.id, programme.year);

  const participant = await prisma.participant.create({
    data: {
      registrationId,
      programmeId: programme.id,
      surname,
      otherName,
      gender,
      ageGroup,
      email,
      phone,
      category,
      zone,
      healthChallenges: healthChallenges || null,
      isMinor: Boolean(isMinor),
      guardianName: isMinor ? guardianName : null,
      guardianContact: isMinor ? guardianContact : null,
      classId: matchedClass.id,
      // houseId intentionally left unset — houses are only assigned to
      // FULLY_PAID participants, via /api/houses/assign or /auto-assign.
    },
  });

  await prisma.attendance.create({ data: { participantId: participant.id } });

  return NextResponse.json(
    {
      success: true,
      registrationId: participant.registrationId,
      participantId: participant.id,
      class: matchedClass.name,
    },
    { status: 201 }
  );
}
