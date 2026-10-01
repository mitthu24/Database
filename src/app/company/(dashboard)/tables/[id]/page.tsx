import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCompanySession, can } from '@/lib/auth';
import { canAccessTable } from '@/lib/table-access';
import TableActions from './table-actions';
import DataTable from './data-table';
import TableAccessPanel from './table-access-panel';

export default async function TableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCompanySession();
  if (!session) redirect('/company/login');

  const table = await prisma.tableDef.findUnique({ where: { id } });
  if (!table || table.companyId !== session.companyId) notFound();
  if (!(await canAccessTable(session, table.id))) notFound();

  const PAGE_SIZE = 50;
  const [rows, totalRows, logs] = await Promise.all([
    prisma.tableRow.findMany({ where: { tableId: table.id }, orderBy: { createdAt: 'desc' }, take: PAGE_SIZE }),
    prisma.tableRow.count({ where: { tableId: table.id } }),
    prisma.ingestionLog.findMany({ where: { tableId: table.id }, orderBy: { createdAt: 'desc' }, take: 30 }),
  ]);

  const columns = table.columns as { name: string; type: string }[];

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>{table.name}</h2>
          <span className="muted">{columns.length} columns</span>
        </div>
        <p className="muted">{columns.map((c) => `${c.name} (${c.type})`).join(', ')}</p>

        <TableActions
          tableId={table.id}
          canAppend={can(session.role, 'rows:append')}
          canReplace={can(session.role, 'rows:replace')}
          canDeleteAll={can(session.role, 'rows:delete_all')}
          canDeleteTable={can(session.role, 'tables:delete')}
          canExport={can(session.role, 'rows:export')}
        />
      </div>

      {can(session.role, 'tables:manage_access') && (
        <div className="card">
          <h2>Access</h2>
          <p className="muted">
            By default every active team member can see this table. Grant access to specific Data
            Entry / Data Analyst users to restrict it to just them (Company Admins and Data
            Managers always have access).
          </p>
          <TableAccessPanel tableId={table.id} />
        </div>
      )}

      <div className="card">
        <DataTable
          tableId={table.id}
          columns={columns}
          initialRows={rows.map((r) => ({
            id: r.id,
            createdAt: r.createdAt.toISOString(),
            data: r.data as Record<string, unknown>,
          }))}
          total={totalRows}
          pageSize={PAGE_SIZE}
        />
      </div>

      <div className="card">
        <h2>Ingestion log</h2>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Rows</th>
              <th>By</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{l.action}</td>
                <td>{l.rowCount ?? '-'}</td>
                <td className="muted">{l.actorName ?? '-'}</td>
                <td className="muted">{l.createdAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No activity yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
