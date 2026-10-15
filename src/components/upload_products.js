// Import des produits vers Firestore (collection "products").
// Usage : node upload_products.js [--dry-run] [--allow-uncategorized]
// Prérequis : npm i firebase-admin ; variable GOOGLE_APPLICATION_CREDENTIALS = chemin du JSON du compte de service
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry-run');
const ALLOW_UNCAT = process.argv.includes('--allow-uncategorized');
const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'products_import.json'), 'utf8'));

const bad = products.filter(p => !p.name || !(p.price > 0));
if (bad.length) { console.error('Produits invalides :', bad.slice(0, 5)); process.exit(1); }
const uncategorized = products.filter(p => !p.category);
if (uncategorized.length && !ALLOW_UNCAT) {
  console.error(`${uncategorized.length} produits sans catégorie. Remplissez "category" ou relancez avec --allow-uncategorized.`);
  process.exit(1);
}
console.log(`${products.length} produits prêts` + (DRY ? ' (dry-run, rien écrit)' : ''));
if (DRY) process.exit(0);

const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

(async () => {
  const now = admin.firestore.FieldValue.serverTimestamp();
  for (let i = 0; i < products.length; i += 400) {            // limite Firestore : 500 écritures/batch
    const batch = db.batch();
    for (const p of products.slice(i, i + 400)) {
      const { id, source, stock, ...data } = p;
      batch.set(db.collection('products').doc(id), { ...data, currency: 'TND', updatedAt: now }, { merge: true });
    }
    await batch.commit();
    console.log(`écrits : ${Math.min(i + 400, products.length)}/${products.length}`);
  }
  const snap = await db.collection('products').count().get();
  console.log('Total dans "products" :', snap.data().count);
})().catch(e => { console.error(e); process.exit(1); });
