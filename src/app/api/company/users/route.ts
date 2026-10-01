import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { requireCompanySession } from '@/lib/require-session';
import { generatePassword } from '@/lib/util';
import { z } from 'zod';

export async function GET() {
  const { session, error } = await requireCompanySession();
  if (error) return error;

  const users = await prisma.companyUser.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });
  return NextResponse.json({ users });
}

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['COMPANY_ADMIN', 'DATA_MANAGER', 'DATA_ANALYST', 'DATA_ENTRY']),
});

export async function POST(req: NextRequest) {
  const { session, error } = await requireCompanySession('users:manage');
  if (error) return error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { email, name, role } = parsed.data;

  const existing = await prisma.companyUser.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

  const tempPassword = generatePassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.companyUser.create({
    data: { companyId: session.companyId, email, name, role, passwordHash },
  });

  return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role }, tempPassword });
}
