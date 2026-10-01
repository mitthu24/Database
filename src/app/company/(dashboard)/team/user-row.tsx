'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CompanyUser } from '@prisma/client';

export default function UserRow({ user, isSelf }: { user: CompanyUser; isSelf: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    await fetch(`/api/company/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <tr>
      <td>{user.name}</td>
      <td className="muted">{user.email}</td>
      <td>
        <span className="badge">{user.role.replace('_', ' ')}</span>
      </td>
      <td>{user.active ? 'Active' : 'Disabled'}</td>
      <td>
        {!isSelf && (
          <button className="secondary" disabled={loading} onClick={toggleActive}>
            {user.active ? 'Disable' : 'Enable'}
          </button>
        )}
      </td>
    </tr>
  );
}
