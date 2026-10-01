'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLES = ['DATA_ENTRY', 'DATA_ANALYST', 'DATA_MANAGER', 'COMPANY_ADMIN'] as const;

export default function CreateUserForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<(typeof ROLES)[number]>('DATA_ENTRY');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    const res = await fetch('/api/company/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error || 'Failed to create user');
      return;
    }
    setResult({ email: body.user.email, tempPassword: body.tempPassword });
    setName('');
    setEmail('');
    setRole('DATA_ENTRY');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="success">
          Created. Login: <strong>{result.email}</strong> / temp password:{' '}
          <strong>{result.tempPassword}</strong> (shown once).
        </div>
      )}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create user'}
      </button>
    </form>
  );
}
