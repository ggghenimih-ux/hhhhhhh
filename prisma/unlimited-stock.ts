import 'dotenv/config';
import { disconnectDatabase, prisma } from '../server/db/client';
import { TRACK_STOCK, UNLIMITED_STOCK } from '../server/config/stock';

async function main() {
  if (TRACK_STOCK) {
    throw new Error('TRACK_STOCK=true : refusing to replace tracked inventory.');
  }

  const { count } = await prisma.product.updateMany({
    data: { stock: UNLIMITED_STOCK, lowStockThreshold: 0 },
  });
  console.log(`${count} product(s) set to unlimited stock (${UNLIMITED_STOCK}).`);
}

main()
  .catch((err) => {
    console.error('Unable to set unlimited stock:', err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
