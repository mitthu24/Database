'use client';

import { useMemo, useState } from 'react';

type Column = { name: string; type: string };
type Row = { id: string; createdAt: string; data: Record<string, unknown> };

export default function DataTable({ columns, rows }: { columns: Column[]; rows: Row[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      columns.some((c) => String(r.data[c.name] ?? '').toLowerCase().includes(q)),
    );
  }, [query, rows, columns]);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>
          Data (showing {filtered.length} of {rows.length} loaded)
        </h2>
        <input
          type="text"
          placeholder="Search in this table..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 240 }}
        />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.name}>{c.name}</th>
              ))}
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                {columns.map((c) => (
                  <td key={c.name}>{String(r.data[c.name] ?? '')}</td>
                ))}
                <td className="muted">{r.createdAt.slice(0, 16).replace('T', ' ')}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="muted">
                  {rows.length === 0 ? 'No data yet. Upload a CSV above.' : 'No rows match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
