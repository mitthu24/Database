import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createFounderSession, verifyPassword } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const founder = await prisma.founder.findUnique({ where: { email } });
  if (!founder || !(await verifyPassword(password, founder.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await createFounderSession(founder.id, founder.email);
  return NextResponse.json({ ok: true });
}
