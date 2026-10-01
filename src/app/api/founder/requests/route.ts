import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFounderSession } from '@/lib/auth';

export async function GET() {
  const session = await getFounderSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const requests = await prisma.companyRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ requests });
}
