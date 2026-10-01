import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireCompanySession } from '@/lib/require-session';
import { z } from 'zod';

async function loadOwnedTable(companyId: string, id: string) {
  const table = await prisma.tableDef.findUnique({ where: { id } });
  if (!table || table.companyId !== companyId) return null;
  return table;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireCompanySession('tables:manage_access');
  if (error) return error;

  const { id } = await params;
  const table = await loadOwnedTable(session.companyId, id);
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [restrictableUsers, grants] = await Promise.all([
    prisma.companyUser.findMany({
      where: { companyId: session.companyId, role: { in: ['DATA_ENTRY', 'DATA_ANALYST'] } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, role: true, active: true },
    }),
    prisma.tableAccess.findMany({ where: { tableId: table.id }, select: { userId: true } }),
  ]);

  return NextResponse.json({
    users: restrictableUsers,
    grantedUserIds: grants.map((g) => g.userId),
  });
}

const schema = z.object({ userIds: z.array(z.string()) });

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireCompanySession('tables:manage_access');
  if (error) return error;

  const { id } = await params;
  const table = await loadOwnedTable(session.companyId, id);
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  // Only allow granting to restrictable roles in this company, ignoring anything else silently.
  const validUsers = await prisma.companyUser.findMany({
    where: {
      id: { in: parsed.data.userIds },
      companyId: session.companyId,
      role: { in: ['DATA_ENTRY', 'DATA_ANALYST'] },
    },
    select: { id: true },
  });
  const validIds = validUsers.map((u) => u.id);

  await prisma.$transaction([
    prisma.tableAccess.deleteMany({ where: { tableId: table.id } }),
    prisma.tableAccess.createMany({
      data: validIds.map((userId) => ({ tableId: table.id, userId })),
    }),
  ]);

  return NextResponse.json({ ok: true, grantedUserIds: validIds });
}
