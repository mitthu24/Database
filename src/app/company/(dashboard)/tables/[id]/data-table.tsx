'use client';

import { useMemo, useState } from 'react';

type Column = { name: string; type: string };
type Row = { id: string; createdAt: string; data: Record<string, unknown> };

export default function DataTable({
  tableId,
  columns,
  initialRows,
  total,
  pageSize,
}: {
  tableId: string;
  columns: Column[];
  initialRows: Row[];
  total: number;
  pageSize: number;
}) {
  const [rows, setRows] = useState(initialRows);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      columns.some((c) => String(r.data[c.name] ?? '').toLowerCase().includes(q)),
    );
  }, [query, rows, columns]);

  async function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > pageCount || nextPage === page) return;
    setLoading(true);
    const res = await fetch(`/api/company/tables/${tableId}/rows?page=${nextPage}&pageSize=${pageSize}`);
    const body = await res.json().catch(() => null);
    setLoading(false);
    if (res.ok && body) {
      setRows(
        body.rows.map((r: { id: string; createdAt: string; data: Record<string, unknown> }) => ({
          id: r.id,
          createdAt: r.createdAt,
          data: r.data,
        })),
      );
      setPage(nextPage);
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>
          Data ({total} row{total === 1 ? '' : 's'} total)
        </h2>
        <input
          type="text"
          placeholder="Search this page..."
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
                  {rows.length === 0 ? 'No data yet. Upload a CSV above.' : 'No rows on this page match your search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
          <span className="muted">
            Page {page} of {pageCount}
          </span>
          <div className="row">
            <button className="secondary" disabled={loading || page <= 1} onClick={() => goToPage(page - 1)}>
              Previous
            </button>
            <button className="secondary" disabled={loading || page >= pageCount} onClick={() => goToPage(page + 1)}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
