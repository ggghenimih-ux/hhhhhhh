import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || password.length < 12) {
    throw new Error('Définissez ADMIN_EMAIL et ADMIN_PASSWORD (12 caractères minimum) dans .env');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN' },
    create: { name: 'Administrateur', email, phone: '26383876', passwordHash, role: 'ADMIN' },
  });
  console.log(`Admin prêt : ${email}`);
}

main().finally(() => prisma.$disconnect());