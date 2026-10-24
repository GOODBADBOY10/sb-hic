import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const programme = await prisma.programme.upsert({
    where: { id: 'sb-hic-2026' },
    update: {},
    create: {
      id: 'sb-hic-2026',
      name: 'SB HIC 2026',
      year: 2026,
      campStart: new Date('2026-12-23'),
      campEnd: new Date('2026-12-27'),
      venueName: 'Oduduwa College',
      venueAddress: 'Ile-Ife, Osun State',
      earlyBirdFee: 8500,
      flatFee: 12000,
      earlyBirdDeadline: new Date('2026-11-30T23:59:59'),
      defaultHouseCapacity: 40,
      registrationOpen: true,
    },
  });

  // These values must match the <option value="..."> strings in
  // RegisterForm.tsx exactly — the form sends them as the raw "category"
  // field and this is matched against eligibleCategories verbatim.
  await prisma.class.createMany({
    data: [
      { programmeId: programme.id, name: 'Lower Class', eligibleCategories: ['JSS 1-3'] },
      { programmeId: programme.id, name: 'Upper Class', eligibleCategories: ['SS1- SSS 3'] },
      {
        programmeId: programme.id,
        name: 'Dawah Class',
        eligibleCategories: ['School Leaver', 'Undergraduate', 'Graduate', 'Others'],
      },
    ],
    skipDuplicates: true,
  });

  await prisma.house.createMany({
    data: [
      { programmeId: programme.id, name: 'Ali House', gender: 'MALE', capacity: 40 },
      { programmeId: programme.id, name: 'Abu Bakar House', gender: 'MALE', capacity: 40 },
      { programmeId: programme.id, name: 'Khadijah House', gender: 'FEMALE', capacity: 40 },
      { programmeId: programme.id, name: 'Aishah House', gender: 'FEMALE', capacity: 40 },
    ],
    skipDuplicates: true,
  });

  // Super Admin is only created if you've set these in .env — on purpose.
  // No hardcoded default password ships in this codebase.
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      '\nSEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD not set in .env — skipping Super Admin creation.\n' +
        'Set both, then re-run `npx prisma db seed` to create your real admin account.\n'
    );
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.upsert({
      where: { email: email.toLowerCase() },
      update: {},
      create: {
        name: 'Super Admin',
        email: email.toLowerCase(),
        passwordHash,
        role: 'SUPER_ADMIN',
        isProtected: true,
      },
    });
    console.log(`Super Admin account ready for ${email}.`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
