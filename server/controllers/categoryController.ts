import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { CategorySchema } from '../validators/schemas';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = (req as any).user?.role === 'ADMIN';
    const where = isAdmin ? {} : { isActive: true };

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    // Compute products count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (c) => {
        const count = await prisma.product.count({
          where: {
            category: c.slug,
            isActive: true,
          },
        });
        return {
          ...c,
          productsCount: count,
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithCount,
    });
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = CategorySchema.parse(req.body);

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        slug: validated.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        description: validated.description || null,
        image: validated.image || null,
        isActive: validated.isActive ?? true,
        order: req.body.order ? parseInt(req.body.order, 10) : 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès.',
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.image !== undefined && { image: body.image }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(body.order !== undefined && { order: parseInt(body.order, 10) }),
      },
    });

    res.json({
      success: true,
      message: 'Catégorie mise à jour avec succès.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: 'NotFound', message: 'Catégorie introuvable.' });
    }

    // Check if category has active products
    const productsCount = await prisma.product.count({
      where: { category: category.slug },
    });

    if (productsCount > 0) {
      return res.status(400).json({
        error: 'Conflict',
        message: `Impossible de supprimer cette catégorie car elle contient ${productsCount} produit(s). Veuillez d'abord déplacer ou réassigner ces produits.`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès.',
    });
  } catch (err) {
    next(err);
  }
};
