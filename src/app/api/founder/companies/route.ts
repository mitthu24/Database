import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFounderSession, hashPassword } from '@/lib/auth';
import { slugify, generatePassword } from '@/lib/util';
import { z } from 'zod';

export async function GET() {
  const session = await getFounderSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true, tables: true } } },
  });
  return NextResponse.json({ companies });
}

const schema = z.object({
  companyName: z.string().min(2),
  adminEmail: z.string().email(),
  adminName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getFounderSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { companyName, adminEmail, adminName } = parsed.data;

  const baseSlug = slugify(companyName) || 'company';
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.company.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const existingUser = await prisma.companyUser.findUnique({ where: { email: adminEmail } });
  if (existingUser) {
    return NextResponse.json({ error: 'That admin email is already in use' }, { status: 409 });
  }

  const tempPassword = generatePassword();
  const passwordHash = await hashPassword(tempPassword);

  const company = await prisma.company.create({
    data: {
      name: companyName,
      slug,
      users: {
        create: {
          email: adminEmail,
          name: adminName,
          role: 'COMPANY_ADMIN',
          passwordHash,
        },
      },
    },
  });

  return NextResponse.json({
    company,
    adminEmail,
    tempPassword,
  });
}
