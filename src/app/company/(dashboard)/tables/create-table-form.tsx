'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ColType = 'text' | 'number' | 'date' | 'boolean';
type Col = { name: string; type: ColType };

export default function CreateTableForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [columns, setColumns] = useState<Col[]>([{ name: '', type: 'text' }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateColumn(i: number, patch: Partial<Col>) {
    setColumns((cols) => cols.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const cleanColumns = columns.filter((c) => c.name.trim().length > 0);
    const res = await fetch('/api/company/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, columns: cleanColumns }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error || 'Failed to create table');
      return;
    }
    router.push(`/company/tables/${body.table.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label>Table name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <label>Columns</label>
      {columns.map((col, i) => (
        <div className="row" key={i} style={{ marginBottom: 8 }}>
          <input
            type="text"
            placeholder="Column name"
            value={col.name}
            onChange={(e) => updateColumn(i, { name: e.target.value })}
            style={{ flex: 2 }}
          />
          <select
            value={col.type}
            onChange={(e) => updateColumn(i, { type: e.target.value as ColType })}
            style={{ flex: 1 }}
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
          </select>
          <button
            type="button"
            className="secondary"
            onClick={() => setColumns((cols) => cols.filter((_, idx) => idx !== i))}
            disabled={columns.length === 1}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary"
        onClick={() => setColumns((cols) => [...cols, { name: '', type: 'text' }])}
        style={{ marginBottom: 14 }}
      >
        + Add column
      </button>

      {error && <div className="error">{error}</div>}
      <div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create table'}
        </button>
      </div>
    </form>
  );
}
