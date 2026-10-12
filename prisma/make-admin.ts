import 'dotenv/config';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] || '').toLowerCase().trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('Usage : npm run admin:make -- votre@gmail.com');
  }
  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: { name: email.split('@')[0], email, phone: '', passwordHash, role: 'ADMIN' },
  });
  console.log(`OK : ${user.email} est maintenant ADMIN`);
}

main()
  .catch((e) => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());