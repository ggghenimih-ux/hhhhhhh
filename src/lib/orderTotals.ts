type OrderTotalItem = {
  lineTotal?: unknown;
  totalTND?: unknown;
  unitPrice?: unknown;
  priceTND?: unknown;
  price?: unknown;
  qty?: unknown;
  quantity?: unknown;
};

type OrderTotalSource = {
  grandTotal?: unknown;
  totalTND?: unknown;
  total?: unknown;
  items?: unknown;
};

const numericValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const getOrderTotal = (order: OrderTotalSource | Record<string, unknown>): number => {
  for (const value of [order.grandTotal, order.totalTND, order.total]) {
    const amount = numericValue(value);
    if (amount !== null) return amount;
  }

  if (!Array.isArray(order.items)) return 0;

  return (order.items as OrderTotalItem[]).reduce((sum, item) => {
    const lineTotal = numericValue(item.lineTotal) ?? numericValue(item.totalTND);
    if (lineTotal !== null) return sum + lineTotal;

    const unitPrice = numericValue(item.unitPrice)
      ?? numericValue(item.priceTND)
      ?? numericValue(item.price)
      ?? 0;
    const quantity = numericValue(item.qty) ?? numericValue(item.quantity) ?? 1;
    return sum + unitPrice * quantity;
  }, 0);
};
