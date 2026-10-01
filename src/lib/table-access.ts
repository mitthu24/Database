import { prisma } from '@/lib/db';
import type { CompanySession } from '@/lib/auth';

// COMPANY_ADMIN and DATA_MANAGER already hold every table-level permission
// (create/delete tables, append/replace/delete/export rows), so per-table
// restriction only applies to DATA_ENTRY and DATA_ANALYST.
const RESTRICTABLE_ROLES = new Set(['DATA_ENTRY', 'DATA_ANALYST']);

export async function canAccessTable(session: CompanySession, tableId: string): Promise<boolean> {
  if (!RESTRICTABLE_ROLES.has(session.role)) return true;

  const restrictionCount = await prisma.tableAccess.count({ where: { tableId } });
  if (restrictionCount === 0) return true; // table has no restrictions configured: open to the company

  const grant = await prisma.tableAccess.findUnique({
    where: { tableId_userId: { tableId, userId: session.userId } },
  });
  return grant !== null;
}

// Prisma `where` clause for TableDef.findMany that filters to tables this
// user may see: every table for admins/managers, otherwise only tables with
// no restrictions configured OR an explicit grant for this user.
export function visibleTablesWhere(session: CompanySession) {
  if (!RESTRICTABLE_ROLES.has(session.role)) {
    return { companyId: session.companyId };
  }
  return {
    companyId: session.companyId,
    OR: [{ accesses: { none: {} } }, { accesses: { some: { userId: session.userId } } }],
  };
}
