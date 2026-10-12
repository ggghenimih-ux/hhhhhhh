import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => {
  const prisma: any = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    adminOrderExport: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    adminAuditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation((callback: (tx: typeof prisma) => unknown) => callback(prisma));
  return { prisma, state: { role: 'ADMIN' as string } };
});

vi.mock('../server/db/client', () => ({ prisma: dbMocks.prisma }));

describe('Protected admin management and order archiving', () => {
  const jwtSecret = 'admin-features-test-secret-with-enough-length';
  let app: express.Express;
  let jwt: typeof import('jsonwebtoken');

  beforeAll(async () => {
    vi.stubEnv('JWT_SECRET', jwtSecret);
    jwt = await import('jsonwebtoken');
    const [{ default: ordersRouter }, { default: usersRouter }] = await Promise.all([
      import('../server/routes/orders'),
      import('../server/routes/adminUsers'),
    ]);
    app = express();
    app.use(express.json());
    app.use('/api/orders', ordersRouter);
    app.use('/api/admin/users', usersRouter);
    app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'ValidationError' });
      }
      const status = typeof error === 'object' && error !== null && 'status' in error
        ? Number(error.status)
        : 500;
      return res.status(status).json({
        error: error instanceof Error ? error.name : 'InternalServerError',
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    });
  });

  beforeEach(() => {
    dbMocks.state.role = 'ADMIN';
    dbMocks.prisma.user.findUnique.mockReset().mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({
        id: where.id,
        name: 'Test Administrator',
        email: 'admin@example.test',
        role: dbMocks.state.role,
        phone: '',
        tokenVersion: 0,
      }),
    );
    dbMocks.prisma.user.findMany.mockReset().mockResolvedValue([]);
    dbMocks.prisma.user.count.mockReset().mockResolvedValue(0);
    dbMocks.prisma.order.findUnique.mockReset().mockResolvedValue(null);
    dbMocks.prisma.order.findMany.mockReset().mockResolvedValue([]);
    dbMocks.prisma.order.count.mockReset().mockResolvedValue(0);
    dbMocks.prisma.order.updateMany.mockReset().mockResolvedValue({ count: 1 });
    dbMocks.prisma.order.delete.mockReset().mockResolvedValue({ id: 'order-1' });
    dbMocks.prisma.adminOrderExport.create.mockReset().mockResolvedValue({ id: 'export-id' });
    dbMocks.prisma.adminOrderExport.findUnique.mockReset().mockResolvedValue(null);
    dbMocks.prisma.adminOrderExport.update.mockReset().mockResolvedValue({});
    dbMocks.prisma.adminOrderExport.deleteMany.mockReset().mockResolvedValue({ count: 0 });
    dbMocks.prisma.adminAuditLog.create.mockReset().mockResolvedValue({});
    dbMocks.prisma.$transaction.mockReset().mockImplementation(
      (callback: (tx: typeof dbMocks.prisma) => unknown) => callback(dbMocks.prisma),
    );
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  const adminToken = () => jwt.sign(
    { userId: 'admin-1' },
    jwtSecret,
    { algorithm: 'HS256', expiresIn: '1h' },
  );

  it('rejects direct calls without an authenticated session', async () => {
    const response = await request(app)
      .get('/api/orders/admin/archive/preview')
      .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

    expect(response.status).toBe(401);
    expect(dbMocks.prisma.order.count).not.toHaveBeenCalled();
  });

  it('rejects a CUSTOMER even when they call an admin endpoint directly', async () => {
    dbMocks.state.role = 'CUSTOMER';

    const response = await request(app)
      .get('/api/orders/admin/archive/preview')
      .set('Authorization', `Bearer ${adminToken()}`)
      .query({ fromDate: '2024-01-01', toDate: '2024-12-31' });

    expect(response.status).toBe(403);
    expect(dbMocks.prisma.order.count).not.toHaveBeenCalled();
  });

  it('rejects a CUSTOMER from the user-management endpoint', async () => {
    dbMocks.state.role = 'CUSTOMER';

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(403);
    expect(dbMocks.prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('does not expose unsupported user creation or deletion operations', async () => {
    const createResponse = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'New Admin', email: 'new@example.test', role: 'ADMIN' });
    const deleteResponse = await request(app)
      .delete('/api/admin/users/customer-1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(createResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
    expect(dbMocks.prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('lists only safe user fields with pagination and audits the admin request', async () => {
    dbMocks.prisma.user.count.mockResolvedValue(1);
    dbMocks.prisma.user.findMany.mockResolvedValue([{
      id: 'customer-1',
      name: 'Test Customer',
      email: 'customer@example.test',
      phone: '12345678',
      role: 'CUSTOMER',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      _count: { orders: 2 },
    }]);

    const response = await request(app)
      .get('/api/admin/users?page=1&limit=25')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0]).not.toHaveProperty('passwordHash');
    expect(dbMocks.prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 0,
      take: 25,
      select: expect.not.objectContaining({ passwordHash: true }),
    }));
    expect(dbMocks.prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'USER_LIST', actorId: 'admin-1' }),
    }));
  });

  it('returns the server-side count for the explicit archive date range', async () => {
    dbMocks.prisma.order.count.mockResolvedValue(4);

    const response = await request(app)
      .get('/api/orders/admin/archive/preview')
      .set('Authorization', `Bearer ${adminToken()}`)
      .query({ fromDate: '2023-02-01', toDate: '2024-03-31' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, count: 4 });
    expect(dbMocks.prisma.order.count).toHaveBeenCalledWith({
      where: {
        archivedAt: null,
        createdAt: {
          gte: new Date('2023-02-01T00:00:00.000Z'),
          lt: new Date('2024-04-01T00:00:00.000Z'),
        },
      },
    });
  });

  it('creates an export-bound selection token only after server-side export selection', async () => {
    const order = {
      id: 'order-1',
      createdAt: new Date('2023-06-01T00:00:00.000Z'),
      updatedAt: new Date('2023-06-02T00:00:00.000Z'),
      items: [{ id: 'item-1', productName: 'Tool', quantity: 1 }],
    };
    dbMocks.prisma.order.count.mockResolvedValue(1);
    dbMocks.prisma.order.findMany.mockResolvedValue([order]);

    const response = await request(app)
      .post('/api/orders/admin/archive/export')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ fromDate: '2023-01-01', toDate: '2023-12-31' });

    expect(response.status).toBe(200);
    expect(response.headers['x-order-archive-token']).toMatch(/^[\w-]{40,}$/);
    expect(response.body.data).toHaveLength(1);
    expect(dbMocks.prisma.adminOrderExport.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        actorId: 'admin-1',
        orderCount: 1,
        orderIdsJson: JSON.stringify([{
          id: 'order-1',
          updatedAt: order.updatedAt.toISOString(),
        }]),
      }),
    }));
    expect(dbMocks.prisma.adminOrderExport.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { expiresAt: { lte: expect.any(Date) } },
          { consumedAt: { not: null } },
        ],
      },
    });
    expect(dbMocks.prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'ORDER_EXPORT', targetCount: 1 }),
    }));
  });

  it('does not archive any order if one changed after export', async () => {
    const selectionToken = 'selection-token-with-at-least-forty-characters-123456';
    const exportedUpdatedAt = new Date('2023-06-02T00:00:00.000Z');
    dbMocks.prisma.adminOrderExport.findUnique.mockResolvedValue({
      id: 'export-1',
      actorId: 'admin-1',
      tokenHash: 'hashed',
      fromDate: new Date('2023-01-01T00:00:00.000Z'),
      toDate: new Date('2024-01-01T00:00:00.000Z'),
      snapshotAt: new Date('2024-01-01T00:00:00.000Z'),
      orderIdsJson: JSON.stringify([{ id: 'order-1', updatedAt: exportedUpdatedAt.toISOString() }]),
      orderCount: 1,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    dbMocks.prisma.order.findMany.mockResolvedValue([{
      id: 'order-1',
      updatedAt: new Date('2024-02-01T00:00:00.000Z'),
    }]);

    const response = await request(app)
      .post('/api/orders/admin/archive/apply')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ token: selectionToken, confirmedCount: 1 });

    expect(response.status).toBe(409);
    expect(dbMocks.prisma.order.updateMany).not.toHaveBeenCalled();
    expect(dbMocks.prisma.adminOrderExport.update).not.toHaveBeenCalled();
  });

  it('rejects another administrator’s export token', async () => {
    const selectionToken = 'selection-token-with-at-least-forty-characters-123456';
    dbMocks.prisma.adminOrderExport.findUnique.mockResolvedValue({
      id: 'export-1',
      actorId: 'different-admin',
      fromDate: new Date('2023-01-01T00:00:00.000Z'),
      toDate: new Date('2024-01-01T00:00:00.000Z'),
      orderIdsJson: JSON.stringify([{ id: 'order-1', updatedAt: new Date().toISOString() }]),
      orderCount: 1,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const response = await request(app)
      .post('/api/orders/admin/archive/apply')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ token: selectionToken, confirmedCount: 1 });

    expect(response.status).toBe(409);
    expect(dbMocks.prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an expired export token', async () => {
    dbMocks.prisma.adminOrderExport.findUnique.mockResolvedValue({
      id: 'export-1',
      actorId: 'admin-1',
      fromDate: new Date('2023-01-01T00:00:00.000Z'),
      toDate: new Date('2024-01-01T00:00:00.000Z'),
      orderIdsJson: JSON.stringify([{ id: 'order-1', updatedAt: new Date().toISOString() }]),
      orderCount: 1,
      consumedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    });

    const response = await request(app)
      .post('/api/orders/admin/archive/apply')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ token: 'selection-token-with-at-least-forty-characters-123456', confirmedCount: 1 });

    expect(response.status).toBe(409);
    expect(dbMocks.prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it('requires the confirmed count to match the exported selection', async () => {
    dbMocks.prisma.adminOrderExport.findUnique.mockResolvedValue({
      id: 'export-1',
      actorId: 'admin-1',
      fromDate: new Date('2023-01-01T00:00:00.000Z'),
      toDate: new Date('2024-01-01T00:00:00.000Z'),
      orderIdsJson: JSON.stringify([{ id: 'order-1', updatedAt: new Date().toISOString() }]),
      orderCount: 1,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const response = await request(app)
      .post('/api/orders/admin/archive/apply')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ token: 'selection-token-with-at-least-forty-characters-123456', confirmedCount: 2 });

    expect(response.status).toBe(400);
    expect(dbMocks.prisma.order.findMany).not.toHaveBeenCalled();
    expect(dbMocks.prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it('archives exactly the exported orders transactionally and records the action', async () => {
    const selectionToken = 'selection-token-with-at-least-forty-characters-123456';
    const updatedAt = new Date('2023-06-02T00:00:00.000Z');
    dbMocks.prisma.adminOrderExport.findUnique.mockResolvedValue({
      id: 'export-1',
      actorId: 'admin-1',
      fromDate: new Date('2023-01-01T00:00:00.000Z'),
      toDate: new Date('2024-01-01T00:00:00.000Z'),
      orderIdsJson: JSON.stringify([{ id: 'order-1', updatedAt: updatedAt.toISOString() }]),
      orderCount: 1,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    dbMocks.prisma.order.findMany.mockResolvedValue([{ id: 'order-1', updatedAt }]);

    const response = await request(app)
      .post('/api/orders/admin/archive/apply')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ token: selectionToken, confirmedCount: 1 });

    expect(response.status).toBe(200);
    expect(response.body.archivedCount).toBe(1);
    expect(dbMocks.prisma.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'order-1', updatedAt }),
      data: expect.objectContaining({ archivedBy: 'admin-1' }),
    }));
    expect(dbMocks.prisma.adminOrderExport.update).toHaveBeenCalled();
    expect(dbMocks.prisma.adminAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'ORDER_ARCHIVE', targetCount: 1 }),
    }));
  });

  it('allows an ADMIN to delete an order through the protected endpoint', async () => {
    dbMocks.prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'GSM-TN-2024-00000001',
    });
    const response = await request(app)
      .delete('/api/orders/order-1')
      .set('Authorization', `Bearer ${adminToken()}`);

    expect(response.status).toBe(200);
    expect(dbMocks.prisma.order.delete).toHaveBeenCalledWith({ where: { id: 'order-1' } });
    expect(dbMocks.prisma.order.updateMany).not.toHaveBeenCalled();
  });
});
