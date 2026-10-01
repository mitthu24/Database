import { prisma } from '@/lib/db';
import CreateCompanyForm from './create-company-form';

export default async function FounderCompaniesPage() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true, tables: true } } },
  });

  return (
    <>
      <div className="card">
        <h2>Create company</h2>
        <CreateCompanyForm />
      </div>

      <div className="card">
        <h2>Companies ({companies.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Users</th>
              <th>Tables</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="muted">{c.slug}</td>
                <td>
                  <span className="badge">{c.status}</span>
                </td>
                <td>{c._count.users}</td>
                <td>{c._count.tables}</td>
                <td className="muted">{c.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No companies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
