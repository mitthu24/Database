import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFounderSession } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFounderSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const request = await prisma.companyRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request already decided' }, { status: 409 });
  }

  await prisma.companyRequest.update({
    where: { id },
    data: { status: 'REJECTED', decidedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
