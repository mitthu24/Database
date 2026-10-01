import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.FOUNDER_EMAIL;
  const password = process.env.FOUNDER_PASSWORD;
  if (!email || !password) {
    throw new Error('Set FOUNDER_EMAIL and FOUNDER_PASSWORD env vars before seeding.');
  }

  const existing = await prisma.founder.findUnique({ where: { email } });
  if (existing) {
    console.log(`Founder ${email} already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.founder.create({
    data: { email, passwordHash, name: 'Founder' },
  });
  console.log(`Created founder account: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
