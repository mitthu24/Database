import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createCompanySession, verifyPassword } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { email, password } = parsed.data;

  const user = await prisma.companyUser.findUnique({
    where: { email },
    include: { company: true },
  });
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }
  if (user.company.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'This company account is suspended' }, { status: 403 });
  }

  await createCompanySession({
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    role: user.role,
  });
  return NextResponse.json({ ok: true });
}
