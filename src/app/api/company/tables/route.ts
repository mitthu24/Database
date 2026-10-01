import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireCompanySession } from '@/lib/require-session';
import { slugify } from '@/lib/util';
import { z } from 'zod';

export async function GET() {
  const { session, error } = await requireCompanySession();
  if (error) return error;

  const tables = await prisma.tableDef.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { rows: true } } },
  });
  return NextResponse.json({ tables });
}

const columnSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'date', 'boolean']),
});
const schema = z.object({
  name: z.string().min(1),
  columns: z.array(columnSchema).min(1),
});

export async function POST(req: NextRequest) {
  const { session, error } = await requireCompanySession('tables:create');
  if (error) return error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const { name, columns } = parsed.data;

  const baseSlug = slugify(name) || 'table';
  let slug = baseSlug;
  let suffix = 1;
  while (
    await prisma.tableDef.findUnique({ where: { companyId_slug: { companyId: session.companyId, slug } } })
  ) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const table = await prisma.tableDef.create({
    data: { companyId: session.companyId, name, slug, columns },
  });

  await prisma.ingestionLog.create({
    data: { tableId: table.id, action: 'CREATE_TABLE', actorId: session.userId, actorName: session.email },
  });

  return NextResponse.json({ table });
}
