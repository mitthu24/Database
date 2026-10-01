import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCompanySession, can } from '@/lib/auth';
import TableActions from './table-actions';

export default async function TableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCompanySession();
  if (!session) redirect('/company/login');

  const table = await prisma.tableDef.findUnique({ where: { id } });
  if (!table || table.companyId !== session.companyId) notFound();

  const [rows, logs] = await Promise.all([
    prisma.tableRow.findMany({ where: { tableId: table.id }, orderBy: { createdAt: 'desc' }, take: 200 }),
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

      <div className="card">
        <h2>Data (showing latest {rows.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.name}>{c.name}</th>
                ))}
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const data = r.data as Record<string, unknown>;
                return (
                  <tr key={r.id}>
                    {columns.map((c) => (
                      <td key={c.name}>{String(data[c.name] ?? '')}</td>
                    ))}
                    <td className="muted">{r.createdAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="muted">
                    No data yet. Upload a CSV above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
