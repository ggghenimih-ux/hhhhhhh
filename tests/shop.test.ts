import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { isValidTunisianPhone, ProductSchema, ProductStockSchema, ProductUpdateSchema, sanitizePhone } from '../server/validators/schemas';
import { calculateShipping, processOrderCreation } from '../server/services/orderService';
import { UNLIMITED_STOCK } from '../server/config/stock';
import { getOrderById, getOrderByNumber } from '../server/controllers/orderController';
import { uploadSingleImage } from '../server/middleware/upload';
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

describe('3. Unlimited stock configuration', () => {
  it('forces unlimited stock for product creation, updates, and stock edits', () => {
    const baseProduct = {
      name: 'Test Product',
      description: 'A sufficiently long description',
      priceTND: 10,
      category: 'tools',
      image: '/product.jpg',
      stock: 0,
    };

    expect(ProductSchema.parse(baseProduct).stock).toBe(UNLIMITED_STOCK);
    expect(ProductUpdateSchema.parse({ stock: 4 }).stock).toBe(UNLIMITED_STOCK);
    expect(ProductStockSchema.parse({ stock: 0 }).stock).toBe(UNLIMITED_STOCK);
  });
});

describe('4. Database & Order Processing Integration', () => {
  let testProductId: string;
  let createdOrderId: string;
  let createdOrderNumber: string;
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
    await prisma.order.deleteMany({ where: { items: { some: { productId: testProductId } } } });
    await prisma.orderItem.deleteMany({ where: { productId: testProductId } });
    await prisma.product.deleteMany({ where: { id: testProductId } });
  });

  it('should create an order without consuming unlimited stock and calculate total with shipping', async () => {
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
    createdOrderId = order.id;
    createdOrderNumber = order.orderNumber;

    // Unlimited stock is not consumed by orders
    const updatedProd = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(updatedProd?.stock).toBe(initialStock);
  });

  it('should allow an order quantity greater than the stored stock', async () => {
    const currentProd = await prisma.product.findUnique({ where: { id: testProductId } });
    const excessQty = (currentProd?.stock || 0) + 50;

    const order = await processOrderCreation({
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
      });

    expect(order).toBeDefined();
    const updatedProd = await prisma.product.findUnique({ where: { id: testProductId } });
    expect(updatedProd?.stock).toBe(initialStock);
  });

  it('should apply the valid GSM10 coupon on the server total', async () => {
    const order = await processOrderCreation({
      customerName: 'Karim Coupon',
      customerPhone: '98456123',
      governorate: 'Tunis',
      address: 'Tunis Centre',
      paymentMethod: 'cod',
      couponCode: 'gsm10',
      items: [{ productId: testProductId, quantity: 1 }],
    });

    expect(order.couponCode).toBe('GSM10');
    expect(order.discountAmount).toBe(5);
    expect(order.totalTND).toBe(52);
  });

  it('should reject an invalid coupon before creating an order', async () => {
    await expect(
      processOrderCreation({
        customerName: 'Karim Invalid Coupon',
        customerPhone: '98456123',
        governorate: 'Tunis',
        address: 'Tunis Centre',
        paymentMethod: 'cod',
        couponCode: 'INVALID',
        items: [{ productId: testProductId, quantity: 1 }],
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('should deny getOrderById when the requester is not the order owner', async () => {
    const app = express();
    app.get(
      '/orders/:id',
      (req, _res, next) => {
        (req as any).user = { id: 'not-the-owner', role: 'CUSTOMER' };
        next();
      },
      getOrderById,
    );

    const response = await request(app).get(`/orders/${createdOrderId}`);
    expect(response.status).toBe(403);
  });

  it('should mask customer details in public order tracking', async () => {
    const app = express();
    app.get('/orders/:orderNumber', getOrderByNumber);

    const response = await request(app).get(`/orders/${createdOrderNumber}`);
    const trackedOrder = response.body.data;
    expect(response.status).toBe(200);
    expect(trackedOrder.customerName).not.toBe('Karim Test');
    expect(trackedOrder.customerPhone).not.toBe('+21626383876');
    expect(trackedOrder.address).toBe('••••••••');
    expect(trackedOrder).not.toHaveProperty('customerEmail');
  });

  it('should reject uploads that are not valid image files', async () => {
    const app = express();
    app.post('/upload', uploadSingleImage, (_req, res) => res.sendStatus(201));
    app.use((err: any, _req: any, res: any, _next: any) => {
      res.status(err.status || 400).json({ message: err.message });
    });

    const response = await request(app)
      .post('/upload')
      .attach('image', Buffer.from('not an image'), {
        filename: 'fake.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(400);
  });
});
