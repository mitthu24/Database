import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getFounderSession } from '@/lib/auth';
import FounderNav from '../nav';

export default async function FounderDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getFounderSession();
  if (!session) redirect('/founder/login');

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Founder</h1>
        <FounderNav email={session.email} />
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
