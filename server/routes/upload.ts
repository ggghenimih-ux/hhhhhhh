import { Router, Request, Response, NextFunction } from 'express';
import { uploadSingleImage } from '../middleware/upload';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/', requireAdmin, (req: Request, res: Response, next: NextFunction) => {
  uploadSingleImage(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if (!req.file) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Aucun fichier image n’a été téléversé.',
      });
    }

    const publicUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({
      success: true,
      message: 'Image téléversée avec succès.',
      url: publicUrl,
      filename: req.file.filename,
    });
  });
});

export default router;
