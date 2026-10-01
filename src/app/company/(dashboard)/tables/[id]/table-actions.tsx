'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TableActions({
  tableId,
  canAppend,
  canReplace,
  canDeleteAll,
  canDeleteTable,
  canExport,
}: {
  tableId: string;
  canAppend: boolean;
  canReplace: boolean;
  canDeleteAll: boolean;
  canDeleteTable: boolean;
  canExport: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  async function onUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setMessage({ type: 'error', text: 'Choose a CSV file first' });
      return;
    }
    setBusy(true);
    setMessage(null);
    const form = new FormData();
    form.append('file', file);
    form.append('mode', mode);
    const res = await fetch(`/api/company/tables/${tableId}/rows`, { method: 'POST', body: form });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMessage({ type: 'error', text: body.error || 'Upload failed' });
      return;
    }
    setMessage({ type: 'success', text: `${mode === 'replace' ? 'Replaced with' : 'Appended'} ${body.inserted} rows` });
    if (fileInputRef.current) fileInputRef.current.value = '';
    router.refresh();
  }

  async function onDeleteAll() {
    if (!confirm('Delete ALL rows in this table? This cannot be undone.')) return;
    setBusy(true);
    const res = await fetch(`/api/company/tables/${tableId}/rows`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  async function onDeleteTable() {
    if (!confirm('Delete this table and all its data permanently?')) return;
    setBusy(true);
    const res = await fetch(`/api/company/tables/${tableId}`, { method: 'DELETE' });
    setBusy(false);
    if (res.ok) router.push('/company/tables');
  }

  return (
    <div>
      {(canAppend || canReplace) && (
        <div className="row" style={{ marginTop: 14 }}>
          <input type="file" accept=".csv" ref={fileInputRef} style={{ maxWidth: 260 }} />
          <select value={mode} onChange={(e) => setMode(e.target.value as 'append' | 'replace')}>
            {canAppend && <option value="append">Append Data</option>}
            {canReplace && <option value="replace">Replace Full Data</option>}
          </select>
          <button onClick={onUpload} disabled={busy}>
            Upload
          </button>
        </div>
      )}

      {message && <div className={message.type === 'error' ? 'error' : 'success'}>{message.text}</div>}

      <div className="row" style={{ marginTop: 14 }}>
        {canExport && (
          <a className="btn secondary" href={`/api/company/tables/${tableId}/export`}>
            Export CSV
          </a>
        )}
        {canDeleteAll && (
          <button className="danger" onClick={onDeleteAll} disabled={busy}>
            Delete all data
          </button>
        )}
        {canDeleteTable && (
          <button className="danger" onClick={onDeleteTable} disabled={busy}>
            Delete table
          </button>
        )}
      </div>
    </div>
  );
}
