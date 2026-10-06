import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { isValidTunisianPhone, sanitizePhone } from '../server/validators/schemas';
import { calculateShipping, processOrderCreation } from '../server/services/orderService';
import { prisma } from '../server/db/client';

describe('1. Tunisian Phone Number Validation', () => {
  it('should accept valid 8-digit Tunisian mobile numbers starting with 2, 4, 5, 7, 9', () => {
    expect(isValidTunisianPhone('+21626383876')).toBe(true);
    expect(isValidTunisianPhone('+21626383876')).toBe(true);
    expect(isValidTunisianPhone('22123456')).toBe(true);
    expect(isValidTunisianPhone('98456123')).toBe(true);
    expect(isValidTunisianPhone('44556677')).toBe(true);
    expect(isValidTunisianPhone('71889900')).toBe(true);
  });

  it('should accept numbers with spaces, dashes and country code +216', () => {
    expect(isValidTunisianPhone('+216 56 17 7991')).toBe(true);
    expect(isValidTunisianPhone('00216 98-456-123')).toBe(true);
    expect(sanitizePhone('+216 26 383 876')).toBe('26383876');
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidTunisianPhone('12345678')).toBe(false); // starts with 1
    expect(isValidTunisianPhone('5611779')).toBe(false);  // 7 digits
    expect(isValidTunisianPhone('561177999')).toBe(false); // 9 digits
    expect(isValidTunisianPhone('abcdefgh')).toBe(false);
  });
});

describe('2. Shipping & Financial Calculations', () => {
  it('should charge standard shipping (7 DT) when order is below threshold (300 DT)', () => {
    expect(calculateShipping(100)).toBe(7.0);
    expect(calculateShipping(299.9)).toBe(7.0);
  });

  it('should grant free shipping (0 DT) when order meets or exceeds 300 DT', () => {
    expect(calculateShipping(300)).toBe(0.0);
    expect(calculateShipping(890)).toBe(0.0);
  });
});

describe('3. Database & Order Processing Integration', () => {
  let testProductId: string;
  const initialStock = 10;
  const unitPrice = 50.0;

  beforeAll(async () => {
    // Create a temporary test product
    const prod = await prisma.product.create({
      data: {
        name: 'Test Soldering Tip C210',
        slug: `test-c210-tip-${Date.now()}`,
        description: 'Test high precision soldering tip',
        priceTND: unitPrice,
        category: 'soldering-hot-air',
        image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510',
        stock: initialStock,
        isActive: true,
      },
    });
    testProductId = prod.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.orderItem.deleteMany({ where: { productId: testProductId } });
    await prisma.product.deleteMany({ where: { id: testProductId } });
  });

  it('should create order, decrement stock correctly and calculate total with shipping', async () => {
    const qtyToOrder = 2;
    const order = await processOrderCreation({
      customerName: 'Karim Test',
      customerPhone: '+21626383876',
      governorate: 'Tunis',
      address: 'tunis, Tunis',
      paymentMethod: 'cod',
      items: [
        {
          productId: testProductId,
          quantity: qtyToOrder,
        },
      ],
    });

    expect(order).toBeDefined();
    expect(order.orderNumber).toMatch(/^GSM-TN-\d{4}-\d{8}$/);
    expect(order.subtotalTND).toBe(unitPrice * qtyToOrder);
    expect(order.shippingTND).toBe(7.0); // 100 < 300
    expect(order.totalTND).toBe(107.0);

    // Verify atomic stock deduction
    const updatedProd = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(updatedProd?.stock).toBe(initialStock - qtyToOrder);
  });

  it('should prevent order and throw error when requested quantity exceeds available stock', async () => {
    const currentProd = await prisma.product.findUnique({ where: { id: testProductId } });
    const excessQty = (currentProd?.stock || 0) + 50;

    await expect(
      processOrderCreation({
        customerName: 'Samir Overstock',
        customerPhone: '98456123',
        governorate: 'Sfax',
        address: 'Route Teniour',
        paymentMethod: 'cod',
        items: [
          {
            productId: testProductId,
            quantity: excessQty,
          },
        ],
      })
    ).rejects.toThrow();
  });
});
