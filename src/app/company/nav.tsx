'use client';

import { useRouter } from 'next/navigation';
import type { UserRole } from '@prisma/client';

export default function CompanyNav({ email, role }: { email: string; role: UserRole }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/company/logout', { method: 'POST' });
    router.push('/company/login');
    router.refresh();
  }

  return (
    <nav>
      <a href="/company/tables">Tables</a>
      {role === 'COMPANY_ADMIN' && <a href="/company/team">Team</a>}
      <div className="muted" style={{ marginTop: 20, fontSize: 12 }}>
        {email}
        <br />
        <span className="badge">{role}</span>
      </div>
      <button className="secondary" style={{ marginTop: 10 }} onClick={logout}>
        Log out
      </button>
    </nav>
  );
}
