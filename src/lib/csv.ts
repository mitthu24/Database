import Papa from 'papaparse';

export type ColumnType = 'text' | 'number' | 'date' | 'boolean';
export type ColumnDef = { name: string; type: ColumnType };

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return { headers: result.meta.fields ?? [], rows: result.data };
}

export function coerceValue(raw: string | undefined, type: ColumnType) {
  if (raw === undefined || raw === '') return null;
  switch (type) {
    case 'number': {
      const n = Number(raw);
      return Number.isNaN(n) ? null : n;
    }
    case 'boolean':
      return ['true', '1', 'yes', 'y'].includes(raw.trim().toLowerCase());
    case 'date':
    case 'text':
    default:
      return raw;
  }
}

export function csvRowsToTableRows(csvRows: Record<string, string>[], columns: ColumnDef[]) {
  // Match CSV headers to defined columns case-insensitively, ignore extra columns.
  return csvRows.map((row) => {
    const data: Record<string, unknown> = {};
    for (const col of columns) {
      const key = Object.keys(row).find((k) => k.toLowerCase() === col.name.toLowerCase());
      data[col.name] = coerceValue(key ? row[key] : undefined, col.type);
    }
    return data;
  });
}

export function rowsToCsv(columns: ColumnDef[], rows: Record<string, unknown>[]) {
  const headers = columns.map((c) => c.name);
  const data = rows.map((r) => headers.map((h) => (r[h] ?? '') as string | number));
  return Papa.unparse({ fields: headers, data });
}
