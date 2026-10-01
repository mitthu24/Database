import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireCompanySession } from '@/lib/require-session';
import { z } from 'zod';

const schema = z.object({
  active: z.boolean().optional(),
  role: z.enum(['COMPANY_ADMIN', 'DATA_MANAGER', 'DATA_ANALYST', 'DATA_ENTRY']).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireCompanySession('users:manage');
  if (error) return error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { id } = await params;
  const target = await prisma.companyUser.findUnique({ where: { id } });
  if (!target || target.companyId !== session.companyId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (target.id === session.userId) {
    return NextResponse.json({ error: "You can't modify your own account here" }, { status: 400 });
  }

  const user = await prisma.companyUser.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ user: { id: user.id, active: user.active, role: user.role } });
}
