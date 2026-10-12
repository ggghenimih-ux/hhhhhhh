export const UNLIMITED_STOCK = 999_999;
export const MAX_ORDER_QUANTITY = 100;

export const isUnlimitedStock = (stock: number | null | undefined): boolean =>
  stock === UNLIMITED_STOCK;

export const isAvailable = (stock: number | null | undefined): boolean =>
  isUnlimitedStock(stock) || (typeof stock === 'number' && stock > 0);

export const maxOrderQuantity = (stock: number | null | undefined): number =>
  isUnlimitedStock(stock) ? MAX_ORDER_QUANTITY : Math.min(stock ?? 0, MAX_ORDER_QUANTITY);
