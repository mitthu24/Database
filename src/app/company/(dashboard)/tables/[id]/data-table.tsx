'use client';

import { useEffect, useRef, useState } from 'react';

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
  const [rowTotal, setRowTotal] = useState(total);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);

  const pageCount = Math.max(1, Math.ceil(rowTotal / pageSize));

  async function load(nextPage: number, searchValue: string) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(nextPage), pageSize: String(pageSize) });
    if (searchValue) params.set('search', searchValue);
    const res = await fetch(`/api/company/tables/${tableId}/rows?${params}`);
    const body = await res.json().catch(() => null);
    setLoading(false);
    if (res.ok && body) {
      setRows(body.rows);
      setRowTotal(body.total);
      setPage(nextPage);
    }
  }

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(1, query);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function goToPage(nextPage: number) {
    if (nextPage < 1 || nextPage > pageCount || nextPage === page || loading) return;
    load(nextPage, query);
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>
          Data ({rowTotal} row{rowTotal === 1 ? '' : 's'}
          {query ? ' matching' : ' total'})
        </h2>
        <input
          type="text"
          placeholder="Search this table..."
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
            {rows.map((r) => (
              <tr key={r.id}>
                {columns.map((c) => (
                  <td key={c.name}>{String(r.data[c.name] ?? '')}</td>
                ))}
                <td className="muted">{r.createdAt.slice(0, 16).replace('T', ' ')}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="muted">
                  {query ? 'No rows match your search.' : 'No data yet. Upload a CSV above.'}
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
