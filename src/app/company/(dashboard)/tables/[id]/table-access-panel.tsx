'use client';

import { useEffect, useState } from 'react';

type RestrictableUser = { id: string; name: string; email: string; role: string; active: boolean };

export default function TableAccessPanel({ tableId }: { tableId: string }) {
  const [users, setUsers] = useState<RestrictableUser[] | null>(null);
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/company/tables/${tableId}/access`)
      .then((res) => res.json())
      .then((body) => {
        setUsers(body.users ?? []);
        setGranted(new Set(body.grantedUserIds ?? []));
      });
  }, [tableId]);

  function toggle(userId: string) {
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/company/tables/${tableId}/access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: Array.from(granted) }),
    });
    setSaving(false);
    setMessage(
      res.ok
        ? granted.size === 0
          ? 'Saved. This table is open to everyone in the company again.'
          : `Saved. Restricted to ${granted.size} user${granted.size === 1 ? '' : 's'} (plus admins/managers).`
        : 'Failed to save.',
    );
  }

  if (users === null) return <p className="muted">Loading…</p>;
  if (users.length === 0) {
    return <p className="muted">No Data Entry or Data Analyst users yet — create some from the Team page first.</p>;
  }

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Access</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td className="muted">{u.email}</td>
              <td>
                <span className="badge">{u.role.replace('_', ' ')}</span>
              </td>
              <td>
                <input type="checkbox" checked={granted.has(u.id)} onChange={() => toggle(u.id)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {message && <div className="success">{message}</div>}
      <div style={{ marginTop: 10 }}>
        <button onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save access'}
        </button>
      </div>
    </div>
  );
}
