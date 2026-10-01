import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { z } from 'zod';

// One-time bootstrap endpoint: creates the first Founder account on a fresh
// deploy, since this sandboxed build environment can't reach Postgres directly
// to run `npm run db:seed`. Vercel's own build/runtime network can, so the
// schema is pushed at build time (see package.json "build") and this route
// seeds the founder at runtime instead. Guarded by SETUP_SECRET; safe to leave
// in place since it only acts when zero Founder rows exist.
const schema = z.object({
  secret: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).default('Founder'),
});

export async function POST(req: NextRequest) {
  const expected = process.env.SETUP_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'SETUP_SECRET is not configured' }, { status: 500 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  if (parsed.data.secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existingCount = await prisma.founder.count();
  if (existingCount > 0) {
    return NextResponse.json({ error: 'A founder account already exists' }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const founder = await prisma.founder.create({
    data: { email: parsed.data.email, passwordHash, name: parsed.data.name },
  });

  return NextResponse.json({ ok: true, founderEmail: founder.email });
}
