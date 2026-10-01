import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCompanySession } from '@/lib/auth';
import CreateUserForm from './create-user-form';
import UserRow from './user-row';

export default async function TeamPage() {
  const session = await getCompanySession();
  if (!session) redirect('/company/login');
  if (session.role !== 'COMPANY_ADMIN') redirect('/company/tables');

  const users = await prisma.companyUser.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <>
      <div className="card">
        <h2>Invite a team member</h2>
        <p className="muted">
          Data Entry can only append rows. Data Analyst can only read/export. Data Manager can
          create/delete tables and append/replace/delete/export data. Company Admin can do
          everything, including manage the team.
        </p>
        <CreateUserForm />
      </div>

      <div className="card">
        <h2>Team ({users.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} isSelf={u.id === session.userId} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
