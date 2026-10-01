import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFounderSession } from '@/lib/auth';
import { createCompanyWithAdmin, EmailInUseError } from '@/lib/create-company';
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

  try {
    const result = await createCompanyWithAdmin(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof EmailInUseError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
