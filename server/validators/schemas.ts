import { z } from 'zod';
import { TRACK_STOCK, UNLIMITED_STOCK } from '../config/stock';

// Helper to normalize and validate Tunisian phone number (8 digits, starts with 2, 4, 5, 7, or 9)
export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+216/, '').replace(/^00216/, '');
};

export const isValidTunisianPhone = (phone: string): boolean => {
  const sanitized = sanitizePhone(phone);
  return /^[24579]\d{7}$/.test(sanitized);
};

const PHONE_MESSAGE = 'Numéro de téléphone tunisien invalide (8 chiffres commençant par 2, 4, 5, 7 ou 9)';

// Téléphone validé PUIS normalisé : on stocke toujours le format à 8 chiffres
const tunisianPhone = z.string().refine(isValidTunisianPhone, { message: PHONE_MESSAGE }).transform(sanitizePhone);

// Only allow http(s) absolute URLs or site-relative paths (blocks javascript:, data:, etc.)
export const safeUrl = z
  .string()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\//i.test(v) || /^\/(?!\/)/.test(v) || /^[a-z0-9_-]+$/i.test(v), {
    message: 'URL invalide (http/https ou chemin relatif uniquement)',
  });
const safeUrlRequired = safeUrl.refine((v) => v.length > 0, { message: 'URL requise' });

const productImage = z
  .string()
  .max(2000)
  .refine((value) => {
    const image = value.trim();
    if (!image) return true;
    if (image.includes('<') || /^(?:javascript|vbscript|data:text):/i.test(image)) return false;

    return (
      /^https?:\/\/\S+$/i.test(image) ||
      /^\/(?!\/)[^\\<>]*$/.test(image) ||
      /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/]+={0,2}$/i.test(image) ||
      /^(?![a-z][a-z0-9+.-]*:)[^\\<>]+(?:\/[^\\<>]*)*$/i.test(image)
    );
  }, { message: 'URL image invalide' });
const productImageRequired = productImage.refine((value) => value.trim().length > 0, { message: 'URL requise' });

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i, 'Couleur invalide (format #RRGGBB)');

// Lettres/chiffres (y compris arabes) séparés par des tirets : pas d'espaces, de "/" ni de caractères spéciaux
const slugField = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[\p{L}\p{N}_]+(?:-[\p{L}\p{N}_]+)*$/u, 'Slug invalide (lettres, chiffres et tirets uniquement)');

// bcrypt tronque silencieusement au-delà de 72 OCTETS (un caractère arabe = 2 octets ou plus)
const passwordField = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, {
    message: 'Le mot de passe est trop long (72 octets maximum)',
  });

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  email: z.string().trim().toLowerCase().email('Adresse email invalide').max(254),
  phone: tunisianPhone,
  password: passwordField,
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse email invalide').max(254),
  password: z.string().min(1, 'Mot de passe requis').max(200),
});

const specsField = z
  .record(z.string(), z.any())
  .refine((o) => Object.keys(o).length <= 50, { message: 'Trop de caractéristiques (50 maximum)' });

const stockField = z
  .number()
  .int()
  .min(0, 'Le stock doit être un entier positif ou zéro')
  .max(1_000_000)
  .transform((stock) => (TRACK_STOCK ? stock : UNLIMITED_STOCK));

// Champs SANS valeurs par défaut : la mise à jour (.partial()) ne doit jamais réinitialiser un champ absent
const ProductFields = z.object({
  name: z.string().trim().min(2, 'Le nom du produit est requis').max(200),
  slug: slugField.optional(),
  shortDescription: z.string().max(500).optional(),
  description: z.string().min(5, 'La description est requise').max(10000),
  priceTND: z.number().min(0, 'Le prix doit être supérieur ou égal à 0').max(1_000_000),
  compareAtPriceTND: z.number().min(0).max(1_000_000).optional().nullable(),
  category: z.string().min(1, 'La catégorie est requise').max(100),
  image: productImage,
  images: z.array(productImageRequired).max(20).optional(),
  stock: stockField,
  lowStockThreshold: z.number().int().min(0).max(100_000).optional(),
  sku: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  warranty: z.string().max(200).optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  specs: specsField.optional(),
});

// Création : les valeurs par défaut sont appliquées ICI uniquement
export const ProductSchema = ProductFields.extend({
  image: productImageRequired,
  stock: stockField.default(UNLIMITED_STOCK),
  shortDescription: z.string().max(500).default(''),
  images: z.array(productImageRequired).max(20).default([]),
  lowStockThreshold: z.number().int().min(0).max(100_000).default(5),
  sku: z.string().max(100).default(''),
  brand: z.string().max(100).default(''),
  warranty: z.string().max(200).default(''),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  specs: specsField.default({}),
});

export const ProductUpdateSchema = ProductFields.partial();
export const ProductStatusSchema = z.object({ isActive: z.boolean() });
export const ProductStockSchema = z.object({ stock: stockField });

export const StoreSettingsSchema = z.object({
  storeName: z.string().trim().min(2, 'Le nom de la boutique est obligatoire').max(100),
  storeDescription: z.string().max(1000).optional().default(''),
  logoUrl: safeUrl.optional().default('/logo.jpg'),
  faviconUrl: safeUrl.optional().default('/logo.jpg'),
  phone: z.string().min(6, 'Numéro de téléphone requis').max(30),
  whatsapp: z.string().max(30).optional().default(''),
  email: z.string().email('Adresse email invalide').optional().or(z.literal('')),
  address: z.string().max(300).optional().default(''),
  facebookUrl: safeUrl.optional().default(''),
  instagramUrl: safeUrl.optional().default(''),
  tiktokUrl: safeUrl.optional().default(''),
  youtubeUrl: safeUrl.optional().default(''),
  workingHours: z.string().max(200).optional().default(''),
  defaultShippingTND: z.number().min(0, 'Frais de livraison invalides').max(10_000).optional().default(7),
  freeShippingThresholdTND: z.number().min(0, 'Seuil de livraison gratuite invalide').max(1_000_000).optional().default(300),
  currency: z.string().max(10).optional().default('DT'),
  primaryColor: hexColor.optional().default('#ea580c'),
  secondaryColor: hexColor.optional().default('#0f172a'),
  heroTitle: z.string().max(300).optional().default(''),
  heroSubtitle: z.string().max(1000).optional().default(''),
  heroButtonText: z.string().max(100).optional().default(''),
  heroButtonLink: safeUrl.optional().default(''),
  heroImage: safeUrl.optional().default(''),
});

export const OrderItemInputSchema = z.object({
  productId: z.string().min(1, 'ID du produit manquant').max(100),
  quantity: z.number().int().min(1, 'La quantité minimale est 1').max(100, 'Quantité maximale : 100'),
});

// Fusionne les lignes du même produit : empêche de contourner la limite de quantité/stock en dupliquant une ligne
const mergeItems = (items: { productId: string; quantity: number }[]) => {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  }
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
};

export const CreateOrderSchema = z.object({
  customerName: z.string().trim().min(2, 'Le nom et prénom sont obligatoires').max(100),
  customerPhone: tunisianPhone,
  customerEmail: z.string().trim().email('Adresse email invalide').max(254).optional().nullable().or(z.literal('')),
  governorate: z.string().trim().min(2, 'Le gouvernorat est obligatoire').max(60),
  delegation: z.string().trim().max(100).optional().nullable(),
  address: z.string().trim().min(5, 'L’adresse complète est obligatoire (rue, quartier, ville)').max(500),
  notes: z.string().max(1000).optional().nullable(),
  couponCode: z.string().trim().max(50).optional().nullable(),
  // NB : ne laisser que les moyens de paiement réellement pris en charge par le serveur
  paymentMethod: z.enum(['cod', 'bank_transfer', 'online']).default('cod'),
  items: z
    .array(OrderItemInputSchema)
    .min(1, 'Le panier doit contenir au moins un article')
    .max(50)
    .transform(mergeItems)
    .pipe(z.array(OrderItemInputSchema).min(1)),
});

export const OrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  paymentStatus: z.enum(['pending', 'paid', 'failed']).optional(),
});

export const OrderUpdateSchema = z.object({
  customerName: z.string().trim().min(2).max(100).optional(),
  customerPhone: tunisianPhone.optional(),
  customerEmail: z.string().trim().email().max(254).optional().nullable().or(z.literal('')),
  governorate: z.string().trim().min(2).max(60).optional(),
  delegation: z.string().trim().max(100).optional().nullable(),
  address: z.string().trim().min(5).max(500).optional(),
  notes: z.string().max(1000).optional().nullable(),
  paymentMethod: z.enum(['cod', 'bank_transfer', 'online']).optional(),
}).refine((value) => Object.keys(value).length > 0, 'Au moins un champ doit être modifié.');

export const CategorySchema = z.object({
  name: z.string().trim().min(2, 'Le nom de la catégorie est requis').max(100),
  slug: slugField,
  description: z.string().max(1000).optional().nullable(),
  image: safeUrl.optional().nullable(),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().optional(),
});

export const ReviewSchema = z.object({
  productId: z.string().min(1, 'ID du produit manquant').max(100),
  name: z.string().trim().min(2, 'Le nom est requis').max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3, 'Le commentaire doit contenir au moins 3 caractères').max(2000),
});
