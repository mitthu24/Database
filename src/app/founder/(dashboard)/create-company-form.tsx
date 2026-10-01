'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCompanyForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ adminEmail: string; tempPassword: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    const res = await fetch('/api/founder/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, adminName, adminEmail }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error || 'Failed to create company');
      return;
    }
    setResult({ adminEmail: body.adminEmail, tempPassword: body.tempPassword });
    setCompanyName('');
    setAdminName('');
    setAdminEmail('');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label>Company name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Admin name</label>
          <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Admin email</label>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
          />
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="success">
          Company created. Admin login: <strong>{result.adminEmail}</strong> / temp password:{' '}
          <strong>{result.tempPassword}</strong> (shown once — share it securely).
        </div>
      )}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create company'}
      </button>
    </form>
  );
}
