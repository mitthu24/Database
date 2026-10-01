import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { slugify, generatePassword } from '@/lib/util';

export class EmailInUseError extends Error {}

// Shared by founder-manual company creation and self-serve request approval:
// both need the exact same slug/dedupe/temp-password behavior.
export async function createCompanyWithAdmin(params: {
  companyName: string;
  adminEmail: string;
  adminName: string;
}) {
  const { companyName, adminEmail, adminName } = params;

  const baseSlug = slugify(companyName) || 'company';
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.company.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++suffix}`;
  }

  const existingUser = await prisma.companyUser.findUnique({ where: { email: adminEmail } });
  if (existingUser) {
    throw new EmailInUseError('That admin email is already in use');
  }

  const tempPassword = generatePassword();
  const passwordHash = await hashPassword(tempPassword);

  const company = await prisma.company.create({
    data: {
      name: companyName,
      slug,
      users: {
        create: {
          email: adminEmail,
          name: adminName,
          role: 'COMPANY_ADMIN',
          passwordHash,
        },
      },
    },
  });

  return { company, adminEmail, tempPassword };
}
