import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCompanySession } from '@/lib/auth';
import CompanyNav from '../nav';

export default async function CompanyDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getCompanySession();
  if (!session) redirect('/company/login');

  const user = await prisma.companyUser.findUnique({
    where: { id: session.userId },
    include: { company: true },
  });
  if (!user || !user.active || user.company.status !== 'ACTIVE') redirect('/company/login');
  if (user.mustChangePassword) redirect('/company/change-password');

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Company</h1>
        <CompanyNav email={session.email} role={session.role} />
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
