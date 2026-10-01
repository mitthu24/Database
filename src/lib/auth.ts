import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@prisma/client';

const FOUNDER_COOKIE = 'founder_session';
const COMPANY_COOKIE = 'company_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export type FounderSession = { kind: 'founder'; founderId: string; email: string };
export type CompanySession = {
  kind: 'company';
  userId: string;
  companyId: string;
  email: string;
  role: UserRole;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

async function signSession(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function createFounderSession(founderId: string, email: string) {
  const token = await signSession({ kind: 'founder', founderId, email });
  (await cookies()).set(FOUNDER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function createCompanySession(data: Omit<CompanySession, 'kind'>) {
  const token = await signSession({ kind: 'company', ...data });
  (await cookies()).set(COMPANY_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearFounderSession() {
  (await cookies()).delete(FOUNDER_COOKIE);
}

export async function clearCompanySession() {
  (await cookies()).delete(COMPANY_COOKIE);
}

export async function getFounderSession(): Promise<FounderSession | null> {
  const token = (await cookies()).get(FOUNDER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.kind !== 'founder') return null;
    return payload as unknown as FounderSession;
  } catch {
    return null;
  }
}

export async function getCompanySession(): Promise<CompanySession | null> {
  const token = (await cookies()).get(COMPANY_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.kind !== 'company') return null;
    return payload as unknown as CompanySession;
  } catch {
    return null;
  }
}

// --- RBAC -------------------------------------------------------------

export type Permission =
  | 'users:manage'
  | 'tables:create'
  | 'tables:delete'
  | 'rows:append'
  | 'rows:replace'
  | 'rows:delete_all'
  | 'rows:export';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  COMPANY_ADMIN: [
    'users:manage',
    'tables:create',
    'tables:delete',
    'rows:append',
    'rows:replace',
    'rows:delete_all',
    'rows:export',
  ],
  DATA_MANAGER: [
    'tables:create',
    'tables:delete',
    'rows:append',
    'rows:replace',
    'rows:delete_all',
    'rows:export',
  ],
  DATA_ANALYST: ['rows:export'],
  DATA_ENTRY: ['rows:append'],
};

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
