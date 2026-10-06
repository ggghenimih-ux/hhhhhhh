import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { ReviewSchema } from '../validators/schemas';

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = ReviewSchema.parse(req.body);

    const review = await prisma.review.create({
      data: {
        productId: validated.productId,
        name: validated.name.trim(),
        rating: validated.rating,
        comment: validated.comment.trim(),
        isApproved: true,
      },
    });

    // Recalculate product rating average
    const reviews = await prisma.review.findMany({
      where: { productId: validated.productId, isApproved: true },
      select: { rating: true },
    });

    if (reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await prisma.product.update({
        where: { id: validated.productId },
        data: { rating: Math.round(avg * 10) / 10 },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Avis enregistré avec succès.',
      data: review,
    });
  } catch (err) {
    next(err);
  }
};
