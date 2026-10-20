import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const applyRequested = process.argv.includes('--apply');
const confirmationProvided = process.argv.includes('--confirm-stock-migration');
const dryRun = !applyRequested && !confirmationProvided;

if (applyRequested !== confirmationProvided) {
  throw new Error('To write changes, pass both --apply and --confirm-stock-migration. Without them this script only previews.');
}

const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error('Set GOOGLE_CLOUD_PROJECT or FIREBASE_PROJECT_ID before running the migration preview.');
}

initializeApp({ credential: applicationDefault(), projectId });

const db = getFirestore();
const productsSnapshot = await db.collection('products').get();
const products = productsSnapshot.docs
  .map((document) => ({ id: document.id, ref: document.ref, data: document.data() }))
  .filter(({ data }) => typeof data.stock === 'number' && Number.isFinite(data.stock));
const inventorySnapshots = await Promise.all(
  products.map(({ id }) => db.collection('inventory').doc(id).get()),
);
const migrations = [];
const conflicts = [];

products.forEach((product, index) => {
  const existingInventory = inventorySnapshots[index];
  const existingStock = existingInventory.exists ? existingInventory.data()?.stock : undefined;

  if (existingInventory.exists && existingStock !== product.data.stock) {
    conflicts.push({
      productId: product.id,
      publicStock: product.data.stock,
      inventoryStock: existingStock,
      reason: 'inventory document already has a different stock value',
    });
    return;
  }

  migrations.push({
    productId: product.id,
    stock: product.data.stock,
    inventoryDocumentExists: existingInventory.exists,
  });
});

console.log(JSON.stringify({
  projectId,
  mode: dryRun ? 'dry-run (read only)' : 'apply',
  candidateCount: migrations.length,
  migrations,
  conflicts,
}, null, 2));

if (!applyRequested) process.exit(0);

for (let offset = 0; offset < migrations.length; offset += 200) {
  const batch = db.batch();
  for (const migration of migrations.slice(offset, offset + 200)) {
    batch.set(db.collection('inventory').doc(migration.productId), {
      productId: migration.productId,
      stock: migration.stock,
      migratedAt: new Date(),
    }, { merge: true });
    batch.update(db.collection('products').doc(migration.productId), {
      stock: FieldValue.delete(),
    });
  }
  await batch.commit();
}
