import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCompanySession, can } from '@/lib/auth';
import { visibleTablesWhere } from '@/lib/table-access';
import CreateTableForm from './create-table-form';

export default async function TablesPage() {
  const session = await getCompanySession();
  if (!session) redirect('/company/login');

  const tables = await prisma.tableDef.findMany({
    where: visibleTablesWhere(session),
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { rows: true } } },
  });

  return (
    <>
      {can(session.role, 'tables:create') && (
        <div className="card">
          <h2>Create table</h2>
          <CreateTableForm />
        </div>
      )}

      <div className="card">
        <h2>Tables ({tables.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Columns</th>
              <th>Rows</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td className="muted">
                  {(t.columns as { name: string }[]).map((c) => c.name).join(', ')}
                </td>
                <td>{t._count.rows}</td>
                <td className="muted">{t.createdAt.toISOString().slice(0, 10)}</td>
                <td>
                  <a className="btn" href={`/company/tables/${t.id}`}>
                    Open
                  </a>
                </td>
              </tr>
            ))}
            {tables.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No tables yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
