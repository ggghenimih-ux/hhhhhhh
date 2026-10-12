import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple instances of PrismaClient in development with HMR / tsx
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.prismaGlobal ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

// Résultat mis en cache 5 s et logs limités : un orchestrateur qui sonde /health
// toutes les secondes ne doit ni saturer la base ni inonder les logs.
let lastCheck = { at: 0, ok: false };
let lastErrorLog = 0;

export async function checkDatabaseConnection(): Promise<boolean> {
  const now = Date.now();
  if (now - lastCheck.at < 5_000) return lastCheck.ok;

  try {
    await prisma.$queryRaw`SELECT 1`;
    lastCheck = { at: now, ok: true };
    return true;
  } catch (err) {
    lastCheck = { at: now, ok: false };
    if (now - lastErrorLog > 30_000) {
      lastErrorLog = now;
      console.error('Database connection check failed:', err);
    }
    return false;
  }
}

/** À appeler une fois au démarrage. SQLite : mode WAL + délai d'attente pour éviter "database is locked". */
export async function initDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL || '';
  if (!url.startsWith('file:')) return;
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout=5000');
  } catch (err) {
    console.warn('[DB] Impossible de configurer SQLite (WAL/busy_timeout) :', (err as Error).message);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
