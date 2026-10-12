import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../server/middleware/errorHandler';

const dbMocks = vi.hoisted(() => {
  const prisma: any = {
    user: { findUnique: vi.fn() },
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    adminAuditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation((callback: (transaction: typeof prisma) => unknown) => callback(prisma));
  return { prisma, role: { current: 'ADMIN' as string } };
});

vi.mock('../server/db/client', () => ({ prisma: dbMocks.prisma }));

describe('Admin order edit and delete', () => {
  const jwtSecret = 'order-management-test-secret-with-enough-length';
  let app: express.Express;
  let jwt: typeof import('jsonwebtoken');

  beforeAll(async () => {
    vi.stubEnv('JWT_SECRET', jwtSecret);
    jwt = await import('jsonwebtoken');
    const { default: ordersRouter } = await import('../server/routes/orders');
    app = express();
    app.use(express.json());
    app.use('/api/orders', ordersRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    dbMocks.role.current = 'ADMIN';
    dbMocks.prisma.user.findUnique.mockReset().mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({
        id: where.id,
        name: 'Admin',
        email: 'admin@example.test',
        role: dbMocks.role.current,
        phone: '',
        tokenVersion: 0,
      }),
    );
    dbMocks.prisma.order.findUnique.mockReset().mockResolvedValue({
      id: 'order-1',
      orderNumber: 'GSM-TN-2026-12345678',
      archivedAt: null,
      status: 'PENDING',
    });
    dbMocks.prisma.order.update.mockReset().mockResolvedValue({
      id: 'order-1',
      customerName: 'Updated Customer',
      items: [],
    });
    dbMocks.prisma.order.delete.mockReset().mockResolvedValue({ id: 'order-1' });
    dbMocks.prisma.adminAuditLog.create.mockReset().mockResolvedValue({});
    dbMocks.prisma.$transaction.mockReset().mockImplementation(
      (callback: (transaction: typeof dbMocks.prisma) => unknown) => callback(dbMocks.prisma),
    );
  });

  afterAll(() => vi.unstubAllEnvs());

  const adminToken = (userId = 'admin-1') =>
    jwt.sign({ sub: userId, tv: 0 }, jwtSecret, { algorithm: 'HS256', expiresIn: '1h' });

  it('lets an authenticated ADMIN edit validated delivery details', async () => {
    const response = await request(app)
      .patch('/api/orders/order-1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ customerName: 'Updated Customer', address: '12 Rue de Tunis' });

    expect(response.status).toBe(200);
    expect(dbMocks.prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'order-1' },
      data: { customerName: 'Updated Customer', address: '12 Rue de Tunis' },
    }));
    expect(dbMocks.prisma.adminAuditLog.create).toHaveBeenCalled();
  });

  it('rejects invalid edits without updating the order', async () => {
    const response = await request(app)
      .patch('/api/orders/order-1')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ customerPhone: '123' });

    expect(response.status).toBe(400);
    expect(dbMocks.prisma.order.update).not.toHaveBeenCalled();
  });

  it('deletes an order and cascades its order items within the transaction', async () => {
    const response = await request(app)
      .delete('/api/orders/order-1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(dbMocks.prisma.$transaction).toHaveBeenCalledOnce();
    expect(dbMocks.prisma.order.delete).toHaveBeenCalledWith({ where: { id: 'order-1' } });
    expect(dbMocks.prisma.adminAuditLog.create).toHaveBeenCalled();
  });

  it.each(['patch', 'delete'] as const)('rejects unauthenticated %s requests with 401', async (method) => {
    const response = method === 'patch'
      ? await request(app).patch('/api/orders/order-1').send({ customerName: 'Spoofed' })
      : await request(app).delete('/api/orders/order-1');

    expect(response.status).toBe(401);
    expect(dbMocks.prisma.order.update).not.toHaveBeenCalled();
    expect(dbMocks.prisma.order.delete).not.toHaveBeenCalled();
  });

  it.each(['patch', 'delete'] as const)('rejects direct CUSTOMER %s requests with 403', async (method) => {
    dbMocks.role.current = 'CUSTOMER';
    const response = method === 'patch'
      ? await request(app)
        .patch('/api/orders/order-1')
        .set('Authorization', `Bearer ${adminToken('customer-1')}`)
        .send({ customerName: 'Spoofed', role: 'ADMIN' })
      : await request(app)
        .delete('/api/orders/order-1')
        .set('Authorization', `Bearer ${adminToken('customer-1')}`)
        .send({ role: 'ADMIN' });

    expect(response.status).toBe(403);
    expect(dbMocks.prisma.order.update).not.toHaveBeenCalled();
    expect(dbMocks.prisma.order.delete).not.toHaveBeenCalled();
  });
});
