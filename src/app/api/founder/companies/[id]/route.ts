import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFounderSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFounderSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { id } = await params;
  const company = await prisma.company.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json({ company });
}
