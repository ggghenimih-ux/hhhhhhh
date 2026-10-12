import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../server/middleware/errorHandler';

const dbMocks = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn() },
    product: {
      update: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../server/db/client', () => ({ prisma: dbMocks.prisma }));

describe('Admin product update and delete authorization', () => {
  const jwtSecret = 'product-admin-actions-test-secret-with-enough-length';
  let app: express.Express;
  let jwt: typeof import('jsonwebtoken');

  beforeAll(async () => {
    vi.stubEnv('JWT_SECRET', jwtSecret);
    jwt = await import('jsonwebtoken');
    const { default: productsRouter } = await import('../server/routes/products');
    app = express();
    app.use(express.json());
    app.use('/api/products', productsRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    dbMocks.prisma.user.findUnique.mockReset().mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({
        id: where.id,
        name: 'Test User',
        email: 'user@example.test',
        role: 'ADMIN',
        phone: '',
        tokenVersion: 0,
      }),
    );
    dbMocks.prisma.product.update.mockReset().mockResolvedValue({ id: 'product-1', name: 'Updated Product' });
    dbMocks.prisma.product.findUnique.mockReset().mockResolvedValue({
      id: 'product-1',
      orderItems: [],
    });
    dbMocks.prisma.product.delete.mockReset().mockResolvedValue({ id: 'product-1' });
    dbMocks.prisma.$transaction.mockReset().mockImplementation(
      (callback: (transaction: typeof dbMocks.prisma) => unknown) => callback(dbMocks.prisma),
    );
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  const tokenFor = (id: string) => jwt.sign({ sub: id, tv: 0 }, jwtSecret, { algorithm: 'HS256', expiresIn: '1h' });

  it('allows an ADMIN to update a product', async () => {
    const response = await request(app)
      .put('/api/products/product-1')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`)
      .send({ name: 'Updated Product' });

    expect(response.status).toBe(200);
    expect(dbMocks.prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { name: 'Updated Product' },
    });
  });

  it('allows an ADMIN to delete an unreferenced product', async () => {
    const response = await request(app)
      .delete('/api/products/product-1')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`);

    expect(response.status).toBe(200);
    expect(response.body.softDeleted).toBe(false);
    expect(dbMocks.prisma.$transaction).toHaveBeenCalledOnce();
    expect(dbMocks.prisma.product.delete).toHaveBeenCalledWith({ where: { id: 'product-1' } });
  });

  it('preserves order history by deactivating a referenced product', async () => {
    dbMocks.prisma.product.findUnique.mockResolvedValue({
      id: 'product-1',
      orderItems: [{ id: 'order-item-1' }],
    });

    const response = await request(app)
      .delete('/api/products/product-1')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`);

    expect(response.status).toBe(200);
    expect(response.body.softDeleted).toBe(true);
    expect(dbMocks.prisma.$transaction).toHaveBeenCalledOnce();
    expect(dbMocks.prisma.product.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'product-1' },
      data: expect.objectContaining({ isActive: false }),
    }));
    expect(dbMocks.prisma.product.delete).not.toHaveBeenCalled();
  });

  it.each([
    ['update', 'put'],
    ['delete', 'delete'],
  ] as const)('rejects unauthenticated product %s requests with 401', async (_action, method) => {
    const response = method === 'put'
      ? await request(app).put('/api/products/product-1').send({ name: 'Spoofed' })
      : await request(app).delete('/api/products/product-1');

    expect(response.status).toBe(401);
    expect(dbMocks.prisma.product.update).not.toHaveBeenCalled();
    expect(dbMocks.prisma.product.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ['update', 'put'],
    ['delete', 'delete'],
  ] as const)('rejects direct non-admin product %s requests with 403', async (_action, method) => {
    dbMocks.prisma.user.findUnique.mockResolvedValue({
      id: 'customer-1',
      name: 'Customer',
      email: 'customer@example.test',
      role: 'CUSTOMER',
      phone: '',
      tokenVersion: 0,
    });

    const response = method === 'put'
      ? await request(app)
        .put('/api/products/product-1')
        .set('Authorization', `Bearer ${tokenFor('customer-1')}`)
        .send({ name: 'Spoofed', role: 'ADMIN', userId: 'admin-1' })
      : await request(app)
        .delete('/api/products/product-1')
        .set('Authorization', `Bearer ${tokenFor('customer-1')}`)
        .send({ role: 'ADMIN', userId: 'admin-1' });

    expect(response.status).toBe(403);
    expect(dbMocks.prisma.product.update).not.toHaveBeenCalled();
    expect(dbMocks.prisma.product.findUnique).not.toHaveBeenCalled();
    expect(dbMocks.prisma.product.delete).not.toHaveBeenCalled();
  });
});
