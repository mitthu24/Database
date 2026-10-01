import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireCompanySession } from '@/lib/require-session';
import { parseCsv, csvRowsToTableRows, type ColumnDef } from '@/lib/csv';

async function loadOwnedTable(companyId: string, id: string) {
  const table = await prisma.tableDef.findUnique({ where: { id } });
  if (!table || table.companyId !== companyId) return null;
  return table;
}

const MAX_PAGE_SIZE = 200;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireCompanySession();
  if (error) return error;

  const { id } = await params;
  const table = await loadOwnedTable(session.companyId, id);
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(url.searchParams.get('pageSize')) || 50));

  const [rows, total] = await Promise.all([
    prisma.tableRow.findMany({
      where: { tableId: table.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tableRow.count({ where: { tableId: table.id } }),
  ]);

  return NextResponse.json({ rows, total, page, pageSize });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const form = await req.formData().catch(() => null);
  const mode = (form?.get('mode') as string) === 'replace' ? 'replace' : 'append';
  const permission = mode === 'replace' ? 'rows:replace' : 'rows:append';

  const { session, error } = await requireCompanySession(permission);
  if (error) return error;

  const { id } = await params;
  const table = await loadOwnedTable(session.companyId, id);
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const file = form?.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'CSV file is required' }, { status: 400 });
  }

  const text = await file.text();
  const { rows } = parseCsv(text);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 });
  }

  const columns = table.columns as unknown as ColumnDef[];
  const tableRows = csvRowsToTableRows(rows, columns);

  await prisma.$transaction(async (tx) => {
    if (mode === 'replace') {
      await tx.tableRow.deleteMany({ where: { tableId: table.id } });
    }
    await tx.tableRow.createMany({
      data: tableRows.map((data) => ({
        tableId: table.id,
        data: data as Prisma.InputJsonObject,
        createdById: session.userId,
      })),
    });
    await tx.ingestionLog.create({
      data: {
        tableId: table.id,
        action: mode === 'replace' ? 'REPLACE' : 'APPEND',
        rowCount: tableRows.length,
        actorId: session.userId,
        actorName: session.email,
      },
    });
  });

  return NextResponse.json({ ok: true, inserted: tableRows.length, mode });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireCompanySession('rows:delete_all');
  if (error) return error;

  const { id } = await params;
  const table = await loadOwnedTable(session.companyId, id);
  if (!table) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = await prisma.$transaction(async (tx) => {
    const { count } = await tx.tableRow.deleteMany({ where: { tableId: table.id } });
    await tx.ingestionLog.create({
      data: {
        tableId: table.id,
        action: 'DELETE_ALL_ROWS',
        rowCount: count,
        actorId: session.userId,
        actorName: session.email,
      },
    });
    return count;
  });

  return NextResponse.json({ ok: true, deleted: result });
}
