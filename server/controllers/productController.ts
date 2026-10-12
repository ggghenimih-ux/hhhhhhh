import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import {
  ProductSchema,
  ProductUpdateSchema,
  ProductStatusSchema,
  ProductStockSchema,
} from '../validators/schemas';

// Helper to generate URL-safe slugs
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'product-' + Date.now();
}

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      isNew,
      status, // 'all' | 'active' | 'inactive'
      admin,  // 'true' if requested from admin dashboard
      sortBy = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Check if admin user
    const isAdminUser = (req as any).user?.role === 'ADMIN' && admin === 'true';

    // Build Prisma where clause
    const where: any = {};

    if (!isAdminUser) {
      where.isActive = true;
    } else if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (category && category !== 'all') {
      where.category = String(category);
    }

    if (isFeatured === 'true') {
      where.isFeatured = true;
    }

    if (isNew === 'true') {
      where.isNew = true;
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 };
    } else if (inStock === 'false') {
      where.stock = { lte: 0 };
    }

    if (minPrice || maxPrice) {
      where.priceTND = {};
      if (minPrice) where.priceTND.gte = parseFloat(minPrice as string);
      if (maxPrice) where.priceTND.lte = parseFloat(maxPrice as string);
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { shortDescription: { contains: q } },
        { sku: { contains: q } },
        { brand: { contains: q } },
      ];
    }

    // Determine sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price-asc') {
      orderBy = { priceTND: 'asc' };
    } else if (sortBy === 'price-desc') {
      orderBy = { priceTND: 'desc' };
    } else if (sortBy === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sortBy === 'name') {
      orderBy = { name: 'asc' };
    } else if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          reviews: {
            where: { isApproved: true },
            select: { id: true, rating: true, name: true, comment: true, createdAt: true },
            take: 5,
          },
          _count: {
            select: { orderItems: true },
          },
        },
      }),
    ]);

    // Format products safely
    const formattedProducts = products.map((p) => {
      let parsedImages: string[] = [];
      let parsedSpecs: Record<string, any> = {};
      try {
        parsedImages = JSON.parse(p.images);
      } catch {
        parsedImages = [p.image];
      }
      try {
        parsedSpecs = JSON.parse(p.specs);
      } catch {
        parsedSpecs = {};
      }

      return {
        ...p,
        images: parsedImages.length > 0 ? parsedImages : [p.image],
        specs: parsedSpecs,
        ordersCount: p._count.orderItems,
      };
    });

    res.json({
      success: true,
      data: formattedProducts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasMore: pageNum * limitNum < total,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { orderItems: true },
        },
      },
    });

    if (!product || (!product.isActive && (req as any).user?.role !== 'ADMIN')) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'المنتج غير موجود أو تم إخفاؤه',
      });
    }

    let parsedImages: string[] = [];
    let parsedSpecs: Record<string, any> = {};
    try {
      parsedImages = JSON.parse(product.images);
    } catch {
      parsedImages = [product.image];
    }
    try {
      parsedSpecs = JSON.parse(product.specs);
    } catch {
      parsedSpecs = {};
    }

    res.json({
      success: true,
      data: {
        ...product,
        images: parsedImages.length > 0 ? parsedImages : [product.image],
        specs: parsedSpecs,
        ordersCount: product._count.orderItems,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product || (!product.isActive && (req as any).user?.role !== 'ADMIN')) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Produit introuvable.',
      });
    }

    let parsedImages: string[] = [];
    let parsedSpecs: Record<string, any> = {};
    try {
      parsedImages = JSON.parse(product.images);
    } catch {
      parsedImages = [product.image];
    }
    try {
      parsedSpecs = JSON.parse(product.specs);
    } catch {
      parsedSpecs = {};
    }

    res.json({
      success: true,
      data: {
        ...product,
        images: parsedImages.length > 0 ? parsedImages : [product.image],
        specs: parsedSpecs,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = ProductSchema.parse(req.body);

    const generatedSlug = validated.slug && validated.slug.trim()
      ? slugify(validated.slug)
      : slugify(validated.name);

    // Ensure unique slug
    let finalSlug = generatedSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${generatedSlug}-${counter}`;
      counter++;
    }

    const shortDesc = validated.shortDescription || validated.description.slice(0, 150);

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug: finalSlug,
        shortDescription: shortDesc,
        description: validated.description,
        priceTND: validated.priceTND,
        compareAtPriceTND: validated.compareAtPriceTND || null,
        category: validated.category,
        image: validated.image,
        images: JSON.stringify(validated.images && validated.images.length > 0 ? validated.images : [validated.image]),
        stock: validated.stock,
        lowStockThreshold: validated.lowStockThreshold ?? 5,
        sku: validated.sku || `SKU-${Date.now().toString().slice(-6)}`,
        brand: validated.brand || 'GSM',
        warranty: validated.warranty || 'Garantie 6 Mois',
        isNew: validated.isNew ?? false,
        isFeatured: validated.isFeatured ?? false,
        isActive: validated.isActive ?? true,
        specs: JSON.stringify(validated.specs || {}),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès.',
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = ProductUpdateSchema.parse(req.body);

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.slug !== undefined && body.slug.trim()) dataToUpdate.slug = slugify(body.slug);
    if (body.shortDescription !== undefined) dataToUpdate.shortDescription = body.shortDescription;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.priceTND !== undefined) dataToUpdate.priceTND = body.priceTND;
    if (body.compareAtPriceTND !== undefined)
      dataToUpdate.compareAtPriceTND = body.compareAtPriceTND;
    if (body.category !== undefined) dataToUpdate.category = body.category;
    if (body.image !== undefined) dataToUpdate.image = body.image;
    if (body.images !== undefined) dataToUpdate.images = JSON.stringify(body.images);
    if (body.stock !== undefined) dataToUpdate.stock = body.stock;
    if (body.lowStockThreshold !== undefined) dataToUpdate.lowStockThreshold = body.lowStockThreshold;
    if (body.sku !== undefined) dataToUpdate.sku = body.sku;
    if (body.brand !== undefined) dataToUpdate.brand = body.brand;
    if (body.warranty !== undefined) dataToUpdate.warranty = body.warranty;
    if (body.isNew !== undefined) dataToUpdate.isNew = Boolean(body.isNew);
    if (body.isFeatured !== undefined) dataToUpdate.isFeatured = Boolean(body.isFeatured);
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);
    if (body.specs !== undefined) dataToUpdate.specs = JSON.stringify(body.specs);

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'معرف المنتج غير صحيح',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id },
        include: {
          orderItems: {
            select: { id: true },
            take: 1,
          },
        },
      });

      if (!product) return { kind: 'not-found' as const };

      if (product.orderItems.length > 0) {
        const updatedProduct = await tx.product.update({
          where: { id },
          data: {
            isActive: false,
            deletedAt: new Date(),
          },
        });
        return { kind: 'soft-deleted' as const, product: updatedProduct };
      }

      await tx.product.delete({ where: { id } });
      return { kind: 'deleted' as const };
    });

    if (result.kind === 'not-found') {
      return res.status(404).json({
        error: 'NotFound',
        message: 'المنتج غير موجود',
      });
    }

    if (result.kind === 'soft-deleted') {
      return res.status(200).json({
        success: true,
        message: 'المنتج مرتبط بطلبات سابقة وتم إخفاؤه بدل حذفه',
        product: result.product,
        softDeleted: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'تم حذف المنتج نهائيًا',
      deleted: true,
      softDeleted: false,
    });
  } catch (error) {
    next(error);
  }
};

export const patchProductStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = ProductStatusSchema.parse(req.body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NotFound', message: 'Produit introuvable.' });
    }

    const newStatus = typeof isActive === 'boolean' ? isActive : !existing.isActive;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        isActive: newStatus,
        deletedAt: newStatus ? null : (existing.deletedAt || new Date()),
      },
    });

    res.json({
      success: true,
      message: newStatus ? 'تمت إعادة تفعيل المنتج وعرضه في المتجر بنجاح' : 'تم إخفاء المنتج وتعطيله بنجاح',
      data: { id: updated.id, isActive: updated.isActive },
    });
  } catch (err) {
    next(err);
  }
};

export const patchProductStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { stock } = ProductStockSchema.parse(req.body);

    const updated = await prisma.product.update({
      where: { id },
      data: { stock },
    });

    res.json({
      success: true,
      message: `Stock mis à jour : ${updated.stock} unités.`,
      data: { id: updated.id, stock: updated.stock },
    });
  } catch (err) {
    next(err);
  }
};

export const uploadProductImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'BadRequest', message: 'Aucun fichier image fourni.' });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'NotFound', message: 'Produit introuvable.' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    let images: string[] = [];
    try {
      images = JSON.parse(product.images);
    } catch {
      images = [product.image];
    }

    images.push(imageUrl);

    const updated = await prisma.product.update({
      where: { id },
      data: {
        images: JSON.stringify(images),
        image: product.image || imageUrl,
      },
    });

    res.json({
      success: true,
      message: 'Image ajoutée avec succès.',
      data: {
        id: updated.id,
        imageUrl,
        images,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteProductImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, imageId } = req.params;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'NotFound', message: 'Produit introuvable.' });
    }

    let images: string[] = [];
    try {
      images = JSON.parse(product.images);
    } catch {
      images = [product.image];
    }

    const filtered = images.filter((img) => !img.includes(imageId));
    const newMainImage = filtered[0] || '/logo.jpg';

    const updated = await prisma.product.update({
      where: { id },
      data: {
        images: JSON.stringify(filtered),
        image: newMainImage,
      },
    });

    res.json({
      success: true,
      message: 'Image supprimée avec succès.',
      data: {
        id: updated.id,
        images: filtered,
        image: newMainImage,
      },
    });
  } catch (err) {
    next(err);
  }
};
