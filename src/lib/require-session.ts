import { NextResponse } from 'next/server';
import { getCompanySession, can, type Permission } from '@/lib/auth';

export async function requireCompanySession(permission?: Permission) {
  const session = await getCompanySession();
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;
  }
  if (permission && !can(session.role, permission)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const;
  }
  return { session } as const;
}
