import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error('Set GOOGLE_CLOUD_PROJECT or FIREBASE_PROJECT_ID before running this read-only audit.');
}

initializeApp({ credential: applicationDefault(), projectId });

const db = getFirestore();
const [productsSnapshot, categoriesSnapshot] = await Promise.all([
  db.collection('products').get(),
  db.collection('categories').get(),
]);

const products = productsSnapshot.docs.map((document) => ({
  id: document.id,
  ...document.data(),
}));
const categorySlugs = new Set(
  categoriesSnapshot.docs
    .map((document) => document.data().slug)
    .filter((slug) => typeof slug === 'string' && slug.trim()),
);
const nameOf = (product) => {
  const value = product.name;
  if (typeof value === 'string') return value.trim().replace(/\s+/g, ' ');
  if (!value || typeof value !== 'object') return '';
  return [value.fr, value.ar, value.en]
    .find((label) => typeof label === 'string' && label.trim())
    ?.trim()
    .replace(/\s+/g, ' ') ?? '';
};
const hasImage = (product) =>
  (typeof product.image === 'string' && product.image.trim().length > 0) ||
  (Array.isArray(product.images) &&
    product.images.some((image) => typeof image === 'string' && image.trim().length > 0));
const hasPrice = (product) =>
  ['priceTND', 'price'].some((key) => {
    const value = product[key];
    if (typeof value === 'number') return Number.isFinite(value);
    return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value));
  });

const hidden = products
  .filter((product) => product.isActive === false)
  .map(({ id, name, slug, category }) => ({ id, name, slug, category }));
const invalidCategories = products
  .filter((product) => !categorySlugs.has(product.category))
  .map(({ id, name, category }) => ({ id, name, category }));
const missing = {
  image: products.filter((product) => !hasImage(product)).map(({ id, name }) => ({ id, name })),
  slug: products
    .filter((product) => typeof product.slug !== 'string' || !product.slug.trim())
    .map(({ id, name }) => ({ id, name })),
  price: products.filter((product) => !hasPrice(product)).map(({ id, name }) => ({ id, name })),
};
const namesByKey = new Map();

for (const product of products) {
  const name = nameOf(product);
  const key = name.toLocaleLowerCase();
  if (!key) continue;
  const matching = namesByKey.get(key) ?? { name, products: [] };
  matching.products.push({ id: product.id, name });
  namesByKey.set(key, matching);
}

const duplicateNames = [...namesByKey.values()].filter((group) => group.products.length > 1);

console.log(JSON.stringify({
  projectId,
  totalProducts: products.length,
  visibleProducts: products.filter((product) => product.isActive !== false).length,
  counts: {
    hidden: hidden.length,
    invalidCategories: invalidCategories.length,
    missingImage: missing.image.length,
    missingSlug: missing.slug.length,
    missingPrice: missing.price.length,
    duplicateNameGroups: duplicateNames.length,
  },
  hidden,
  invalidCategories,
  missing,
  duplicateNames,
}, null, 2));
