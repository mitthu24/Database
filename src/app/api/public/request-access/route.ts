import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const schema = z.object({
  companyName: z.string().min(2).max(200),
  contactName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  message: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const limit = rateLimit(`request-access:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  await prisma.companyRequest.create({ data: parsed.data });
  return NextResponse.json({ ok: true });
}
