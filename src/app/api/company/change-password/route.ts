import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCompanySession, hashPassword, verifyPassword } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  const session = await getCompanySession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.companyUser.findUnique({ where: { id: session.userId } });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.companyUser.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  return NextResponse.json({ ok: true });
}
