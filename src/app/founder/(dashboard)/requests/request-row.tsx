'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CompanyRequest } from '@prisma/client';

export default function RequestRow({ request }: { request: CompanyRequest }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ adminEmail: string; tempPassword: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/founder/requests/${request.id}/approve`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error || 'Failed to approve');
      return;
    }
    setResult({ adminEmail: body.adminEmail, tempPassword: body.tempPassword });
    router.refresh();
  }

  async function reject() {
    if (!confirm(`Reject the request from ${request.companyName}?`)) return;
    setLoading(true);
    await fetch(`/api/founder/requests/${request.id}/reject`, { method: 'POST' });
    setLoading(false);
    router.refresh();
  }

  if (result) {
    return (
      <tr>
        <td colSpan={5} className="success">
          Approved {request.companyName}. Admin login: <strong>{result.adminEmail}</strong> / temp
          password: <strong>{result.tempPassword}</strong> (shown once).
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{request.companyName}</td>
      <td className="muted">
        {request.contactName} &lt;{request.contactEmail}&gt;
      </td>
      <td className="muted">{request.message || '-'}</td>
      <td className="muted">{request.createdAt.toISOString().slice(0, 10)}</td>
      <td>
        <div className="row">
          <button disabled={loading} onClick={approve}>
            Approve
          </button>
          <button className="danger" disabled={loading} onClick={reject}>
            Reject
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </td>
    </tr>
  );
}
