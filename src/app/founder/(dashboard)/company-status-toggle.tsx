'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CompanyStatus } from '@prisma/client';

export default function CompanyStatusToggle({ id, status }: { id: string; status: CompanyStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (next === 'SUSPENDED' && !confirm('Suspend this company? Its users will be unable to log in.')) {
      return;
    }
    setLoading(true);
    await fetch(`/api/founder/companies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button className={status === 'ACTIVE' ? 'danger' : 'secondary'} disabled={loading} onClick={toggle}>
      {status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
    </button>
  );
}
