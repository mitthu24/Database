import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFounderSession } from '@/lib/auth';
import { createCompanyWithAdmin, EmailInUseError } from '@/lib/create-company';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getFounderSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const request = await prisma.companyRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (request.status !== 'PENDING') {
    return NextResponse.json({ error: 'Request already decided' }, { status: 409 });
  }

  try {
    const result = await createCompanyWithAdmin({
      companyName: request.companyName,
      adminEmail: request.contactEmail,
      adminName: request.contactName,
    });

    await prisma.companyRequest.update({
      where: { id },
      data: { status: 'APPROVED', decidedAt: new Date() },
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof EmailInUseError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
