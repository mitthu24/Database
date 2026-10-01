import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCompanySession } from '@/lib/auth';
import CompanyNav from '../nav';

export default async function CompanyDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getCompanySession();
  if (!session) redirect('/company/login');

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
