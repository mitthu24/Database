import { NextResponse } from 'next/server';
import { clearFounderSession } from '@/lib/auth';

export async function POST() {
  await clearFounderSession();
  return NextResponse.json({ ok: true });
}
