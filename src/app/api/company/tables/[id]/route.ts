import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireCompanySession } from '@/lib/require-session';

async function loadOwnedTable(companyId: string, id: string) {
  const table = await prisma.tableDef.findUnique({ where: { id } });
  if (!table || table.companyId !== companyId) return null;
  return table;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireCompanySession();
  if (error) return error;

  const { id } = await params;
  const table = await loadOwnedTable(session.companyId, id);
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [rows, logs] = await Promise.all([
    prisma.tableRow.findMany({
      where: { tableId: table.id },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.ingestionLog.findMany({
      where: { tableId: table.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return NextResponse.json({ table, rows, logs, rowCountShown: rows.length });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireCompanySession('tables:delete');
  if (error) return error;

  const { id } = await params;
  const table = await loadOwnedTable(session.companyId, id);
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.ingestionLog.create({
    data: { tableId: table.id, action: 'DELETE_TABLE', actorId: session.userId, actorName: session.email },
  });
  await prisma.tableDef.delete({ where: { id: table.id } });

  return NextResponse.json({ ok: true });
}
