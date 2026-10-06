import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client';
import { StoreSettingsSchema } from '../validators/schemas';

// Default settings fallback
const DEFAULT_SETTINGS = {
  id: 'default',
  storeName: 'Outils Réparation GSM Tunisie',
  storeDescription: 'N°1 en Outillage & Équipements de Réparation Smartphone en Tunisie. Stations de soudure, microscopes, programmeurs et pièces détachées.',
  logoUrl: '/logo.jpg',
  faviconUrl: '/logo.jpg',
  phone: '+216 26 383 876',
  whatsapp: '+216 26 383 876',
  email: 'contact@reparation-gsm.tn',
  address: 'Tunis,tunis',
  facebookUrl: 'https://facebook.com/outils.reparation.gsm',
  instagramUrl: 'https://instagram.com/outils.reparation.gsm',
  tiktokUrl: 'https://tiktok.com/@outilsreparationgsm',
  youtubeUrl: 'https://youtube.com/@outilsreparationgsm',
  workingHours: 'Mar - Dim: 08:00 - 18:00 | Lundi: Fermé',
  defaultShippingTND: 7.0,
  freeShippingThresholdTND: 300.0,
  currency: 'DT',
  primaryColor: '#ea580c',
  secondaryColor: '#0f172a',
  heroTitle: 'معدات وأدوات صيانة الهواتف الذكية للمحترفين',
  heroSubtitle: 'محطات لحام دقيقة، ميكروسكوبات ثلاثية العيون، مبرمجات سوفتوير، ومزودات طاقة أصلية مع توصيل سريع 24/48 ساعة وضمان حقيقي.',
  heroButtonText: 'عرض جميع المنتجات',
  heroButtonLink: 'products',
  heroImage: '/logo.jpg',
};

export const getSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: DEFAULT_SETTINGS,
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate, then keep ONLY the fields actually sent (schema defaults must not overwrite stored values)
    const parsed = StoreSettingsSchema.partial().parse(req.body);
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const validated = Object.fromEntries(
      Object.entries(parsed).filter(([key]) => Object.prototype.hasOwnProperty.call(body, key))
    ) as typeof parsed;

    const updated = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: {
        ...validated,
      },
      create: {
        ...DEFAULT_SETTINGS,
        ...validated,
        id: 'default',
      },
    });

    res.json({
      success: true,
      message: 'Paramètres du magasin mis à jour avec succès.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const uploadLogo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Aucun fichier fourni.',
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const updated = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: { logoUrl: fileUrl },
      create: {
        ...DEFAULT_SETTINGS,
        logoUrl: fileUrl,
      },
    });

    res.json({
      success: true,
      message: 'Logo mis à jour avec succès.',
      data: {
        logoUrl: updated.logoUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const uploadFavicon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Aucun fichier fourni.',
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const updated = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: { faviconUrl: fileUrl },
      create: {
        ...DEFAULT_SETTINGS,
        faviconUrl: fileUrl,
      },
    });

    res.json({
      success: true,
      message: 'Favicon mis à jour avec succès.',
      data: {
        faviconUrl: updated.faviconUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};
