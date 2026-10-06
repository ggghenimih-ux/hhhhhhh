/**
 * Image Utilities & Safe Fallbacks for GSM Tools
 */

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';

export const FALLBACK_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=600&q=80';

export function getSafeImageUrl(url?: string | null, fallback = FALLBACK_PRODUCT_IMAGE): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }
  return url.trim();
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, fallback = FALLBACK_PRODUCT_IMAGE) {
  const target = e.currentTarget;
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
