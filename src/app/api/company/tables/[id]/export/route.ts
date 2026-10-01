import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireCompanySession } from '@/lib/require-session';
import { rowsToCsv, type ColumnDef } from '@/lib/csv';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireCompanySession('rows:export');
  if (error) return error;

  const { id } = await params;
  const table = await prisma.tableDef.findUnique({ where: { id } });
  if (!table || table.companyId !== session.companyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rows = await prisma.tableRow.findMany({
    where: { tableId: table.id },
    orderBy: { createdAt: 'asc' },
  });

  const columns = table.columns as unknown as ColumnDef[];
  const csv = rowsToCsv(
    columns,
    rows.map((r) => r.data as Record<string, unknown>),
  );

  await prisma.ingestionLog.create({
    data: {
      tableId: table.id,
      action: 'EXPORT',
      rowCount: rows.length,
      actorId: session.userId,
      actorName: session.email,
    },
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${table.slug}.csv"`,
    },
  });
}
