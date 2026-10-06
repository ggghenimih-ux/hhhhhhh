import { z } from 'zod';

// Helper to normalize and validate Tunisian phone number (8 digits, starts with 2, 4, 5, 7, or 9)
export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+216/, '').replace(/^00216/, '');
};

export const isValidTunisianPhone = (phone: string): boolean => {
  const sanitized = sanitizePhone(phone);
  return /^[24579]\d{7}$/.test(sanitized);
};

// Only allow http(s) absolute URLs or site-relative paths (blocks javascript:, data:, etc.)
export const safeUrl = z
  .string()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//i.test(v) || /^\/(?!\/)/.test(v) || /^[a-z0-9_-]+$/i.test(v), {
    message: 'URL invalide (http/https ou chemin relatif uniquement)',
  });

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  email: z.string().trim().email('Adresse email invalide').max(254),
  phone: z.string().refine(isValidTunisianPhone, {
    message: 'Numéro de téléphone tunisien invalide (8 chiffres commençant par 2, 4, 5, 7 ou 9)',
  }),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(72, 'Le mot de passe est trop long (72 caractères maximum)'),
});

export const LoginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis').max(200),
});

export const ProductSchema = z.object({
  name: z.string().min(2, 'Le nom du produit est requis'),
  slug: z.string().optional(),
  shortDescription: z.string().optional().default(''),
  description: z.string().min(5, 'La description est requise'),
  priceTND: z.number().min(0, 'Le prix doit être supérieur ou égal à 0'),
  compareAtPriceTND: z.number().min(0).optional().nullable(),
  category: z.string().min(1, 'La catégorie est requise'),
  image: z.string().min(1, 'L’image principale est requise'),
  images: z.array(z.string()).optional().default([]),
  stock: z.number().int().min(0, 'Le stock doit être un entier positif ou zéro'),
  lowStockThreshold: z.number().int().min(0).optional().default(5),
  sku: z.string().optional().default(''),
  brand: z.string().optional().default(''),
  warranty: z.string().optional().default(''),
  isNew: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  specs: z.record(z.string(), z.any()).optional().default({}),
});

export const StoreSettingsSchema = z.object({
  storeName: z.string().min(2, 'Le nom de la boutique est obligatoire'),
  storeDescription: z.string().optional().default(''),
  logoUrl: safeUrl.optional().default('/logo.jpg'),
  faviconUrl: safeUrl.optional().default('/logo.jpg'),
  phone: z.string().min(6, 'Numéro de téléphone requis'),
  whatsapp: z.string().optional().default(''),
  email: z.string().email('Adresse email invalide').optional().or(z.literal('')),
  address: z.string().optional().default(''),
  facebookUrl: safeUrl.optional().default(''),
  instagramUrl: safeUrl.optional().default(''),
  tiktokUrl: safeUrl.optional().default(''),
  youtubeUrl: safeUrl.optional().default(''),
  workingHours: z.string().optional().default(''),
  defaultShippingTND: z.number().min(0, 'Frais de livraison invalides').optional().default(7),
  freeShippingThresholdTND: z.number().min(0, 'Seuil de livraison gratuite invalide').optional().default(300),
  currency: z.string().optional().default('DT'),
  primaryColor: z.string().optional().default('#ea580c'),
  secondaryColor: z.string().optional().default('#0f172a'),
  heroTitle: z.string().optional().default(''),
  heroSubtitle: z.string().optional().default(''),
  heroButtonText: z.string().optional().default(''),
  heroButtonLink: safeUrl.optional().default(''),
  heroImage: safeUrl.optional().default(''),
});

export const OrderItemInputSchema = z.object({
  productId: z.string().min(1, 'ID du produit manquant'),
  quantity: z.number().int().min(1, 'La quantité minimale est 1').max(100, 'Quantité maximale : 100'),
});

export const CreateOrderSchema = z.object({
  customerName: z.string().min(2, 'Le nom et prénom sont obligatoires'),
  customerPhone: z.string().refine(isValidTunisianPhone, {
    message: 'Numéro de téléphone tunisien invalide (8 chiffres commençant par 2, 4, 5, 7 ou 9)',
  }),
  customerEmail: z.string().email('Adresse email invalide').optional().or(z.literal('')),
  governorate: z.string().min(2, 'Le gouvernorat est obligatoire'),
  delegation: z.string().optional().nullable(),
  address: z.string().min(5, 'L’adresse complète est obligatoire (rue, quartier, ville)').max(500),
  notes: z.string().max(1000).optional().nullable(),
  paymentMethod: z.enum(['cod', 'bank_transfer', 'online']).default('cod'),
  items: z.array(OrderItemInputSchema).min(1, 'Le panier doit contenir au moins un article').max(50),
});

export const OrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional(),
});

export const CategorySchema = z.object({
  name: z.string().min(2, 'Le nom de la catégorie est requis'),
  slug: z.string().min(2, 'Le slug est requis'),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const ReviewSchema = z.object({
  productId: z.string().min(1, 'ID du produit manquant'),
  name: z.string().trim().min(2, 'Le nom est requis').max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3, 'Le commentaire doit contenir au moins 3 caractères').max(2000),
});
