import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../server/db/client';
import { TRACK_STOCK, UNLIMITED_STOCK } from '../server/config/stock';

type ImportedProduct = {
  name: string;
  priceTND: number;
  shortDescription: string;
  description: string;
  category: string;
  categoryName: string;
  image: string;
  images: string[];
  stock: number;
  source: string;
};

type Manifest = {
  products: ImportedProduct[];
  categories: Array<{ slug: string; name: string }>;
};

const slugBase = (name: string) => {
  const ascii = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii || `produit-${crypto.createHash('sha256').update(name).digest('hex').slice(0, 12)}`;
};

const assertManifest = (manifest: Manifest) => {
  if (!Array.isArray(manifest.products) || !Array.isArray(manifest.categories)) {
    throw new Error('Invalid catalog manifest.');
  }
  for (const product of manifest.products) {
    if (
      !product.name.trim() ||
      !Number.isFinite(product.priceTND) ||
      product.priceTND <= 0 ||
      !product.category ||
      !product.image.startsWith('/uploads/products/') ||
      product.images.length === 0 ||
      product.images.some((url) => !url.startsWith('/uploads/products/'))
    ) {
      throw new Error(`Invalid product record from ${product.source}.`);
    }
    for (const imageUrl of product.images) {
      const imagePath = path.resolve(process.cwd(), 'public', `.${imageUrl}`);
      const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads', 'products');
      if (!imagePath.startsWith(`${uploadsRoot}${path.sep}`) || !fs.existsSync(imagePath)) {
        throw new Error(`Product image is missing or outside the upload directory: ${imageUrl}`);
      }
    }
  }
};

const main = async () => {
  const manifestFlag = process.argv.indexOf('--manifest');
  const manifestPath = manifestFlag >= 0 ? process.argv[manifestFlag + 1] : undefined;
  if (!manifestPath) {
    throw new Error('Usage: tsx prisma/importExcelCatalog.ts --manifest <manifest.json>');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
  assertManifest(manifest);

  const categoryBySlug = new Map(manifest.categories.map((category) => [category.slug, category]));
  const products = manifest.products;
  for (const product of products) {
    const category = categoryBySlug.get(product.category);
    if (!category || category.name !== product.categoryName) {
      throw new Error(`Unknown or mismatched category for product "${product.name}".`);
    }
  }

  const usedCategorySlugs = new Set(products.map((product) => product.category));
  const categoryData = manifest.categories.filter(({ slug }) => usedCategorySlugs.has(slug)).map(({ slug, name }) => ({
    slug,
    name,
    description: null,
    image: null,
    isActive: true,
    order: manifest.categories.findIndex((category) => category.slug === slug),
  }));

  let imported = 0;
  let updated = 0;
  let verifiedImages = 0;
  let records: Array<ImportedProduct & { slug: string; id?: string }> = [];
  await prisma.$transaction(async (tx) => {
    for (const category of categoryData) {
      await tx.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name },
        create: category,
      });
    }

    const existingProducts = await tx.product.findMany({ select: { id: true, slug: true, name: true } });
    const occupiedSlugs = new Map(existingProducts.map((product) => [product.slug, product.name]));
    const existingByName = new Map<string, (typeof existingProducts)[number]>();
    for (const product of existingProducts) {
      const normalizedName = product.name.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
      if (!existingByName.has(normalizedName)) existingByName.set(normalizedName, product);
    }
    const inBatchNames = new Set<string>();
    records = [];
    for (const product of products) {
      const normalizedName = product.name.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
      if (inBatchNames.has(normalizedName)) continue;
      inBatchNames.add(normalizedName);
      const existing = existingByName.get(normalizedName);
      if (existing) {
        records.push({ ...product, slug: existing.slug, id: existing.id });
        continue;
      }

      const base = slugBase(product.name);
      const suffix = crypto.createHash('sha256').update(product.name).digest('hex').slice(0, 8);
      let slug = base;
      let suffixIndex = 0;
      while (occupiedSlugs.has(slug)) {
        slug = `${base}-${suffix}${suffixIndex ? `-${suffixIndex}` : ''}`;
        suffixIndex += 1;
      }
      occupiedSlugs.set(slug, product.name);
      records.push({ ...product, slug });
    }

    for (const record of records) {
      const data = {
        name: record.name,
        shortDescription: record.shortDescription,
        description: record.description,
        priceTND: record.priceTND,
        category: record.category,
        image: record.image,
        images: JSON.stringify(record.images),
        stock: TRACK_STOCK ? record.stock : UNLIMITED_STOCK,
      };

      if (record.id) {
        const result = await tx.product.updateMany({
          where: { id: record.id },
          data: {
            name: data.name,
            priceTND: data.priceTND,
            category: data.category,
            image: data.image,
            images: data.images,
            stock: data.stock,
            ...(record.shortDescription ? { shortDescription: record.shortDescription } : {}),
            ...(record.description ? { description: record.description } : {}),
          },
        });
        if (result.count !== 1) {
          throw new Error(`Existing product disappeared during import: "${record.name}".`);
        }
        updated += 1;
      } else {
        await tx.product.create({
          data: {
            ...data,
            slug: record.slug,
            sku: null,
            brand: null,
            warranty: null,
            isActive: true,
          },
        });
        imported += 1;
      }
    }

    const insertedRecords = await tx.product.findMany({
      where: { slug: { in: records.map((record) => record.slug) } },
      select: { slug: true, image: true, images: true },
    });
    const insertedBySlug = new Map(insertedRecords.map((record) => [record.slug, record]));
    if (insertedRecords.length !== records.length) {
      throw new Error(`Database verification failed: expected ${records.length} imported products, found ${insertedRecords.length}.`);
    }
    for (const record of records) {
      const inserted = insertedBySlug.get(record.slug);
      if (!inserted || inserted.image !== record.image || inserted.images !== JSON.stringify(record.images)) {
        throw new Error(`Database image verification failed for "${record.name}".`);
      }
      verifiedImages += record.images.length;
    }

    await tx.adminAuditLog.create({
      data: {
        actorId: 'system:excel-catalog-import',
        action: 'PRODUCT_CATALOG_IMPORT',
        targetType: 'PRODUCT',
        targetCount: imported + updated,
        outcome: 'SUCCESS',
        details: JSON.stringify({
          imported,
          updated,
          sources: [...new Set(products.map((record) => record.source.split(':')[0]))],
        }),
      },
    });
  }, { timeout: 120_000 });

  const [productCount, categoryCount] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
  ]);

  console.log(JSON.stringify({
    imported,
    updated,
    sourceRecords: products.length,
    totalProducts: productCount,
    totalCategories: categoryCount,
    imagesVerified: verifiedImages,
  }, null, 2));
};

main()
  .catch((error: unknown) => {
    console.error('Catalog import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
