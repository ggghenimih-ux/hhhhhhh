import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../server/middleware/errorHandler';

const dbMocks = vi.hoisted(() => {
  const prisma: any = {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    adminAuditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation((callback: (transaction: typeof prisma) => unknown) => callback(prisma));
  return { prisma, roles: new Map<string, string>() };
});

vi.mock('../server/db/client', () => ({ prisma: dbMocks.prisma }));

describe('Admin user role management', () => {
  const jwtSecret = 'admin-user-management-test-secret-with-enough-length';
  let app: express.Express;
  let jwt: typeof import('jsonwebtoken');

  beforeAll(async () => {
    vi.stubEnv('JWT_SECRET', jwtSecret);
    jwt = await import('jsonwebtoken');
    const { default: usersRouter } = await import('../server/routes/adminUsers');
    app = express();
    app.use(express.json());
    app.use('/api/admin/users', usersRouter);
    app.use(errorHandler);
  });

  beforeEach(() => {
    dbMocks.roles.clear();
    dbMocks.roles.set('admin-1', 'ADMIN');
    dbMocks.roles.set('admin-2', 'ADMIN');
    dbMocks.roles.set('customer-1', 'CUSTOMER');
    dbMocks.prisma.user.findUnique.mockReset().mockImplementation(({ where }: { where: { id: string } }) => {
      const role = dbMocks.roles.get(where.id);
      return Promise.resolve(role ? {
        id: where.id,
        name: 'Test User',
        email: 'user@example.test',
        phone: '',
        role,
        tokenVersion: 0,
        createdAt: new Date(),
      } : null);
    });
    dbMocks.prisma.user.count.mockReset().mockResolvedValue(2);
    dbMocks.prisma.user.update.mockReset().mockImplementation(({ where, data }: {
      where: { id: string };
      data: { role: string };
    }) => {
      dbMocks.roles.set(where.id, data.role);
      return Promise.resolve({
        id: where.id,
        name: 'Test User',
        email: 'user@example.test',
        phone: '',
        role: data.role,
        tokenVersion: 0,
        createdAt: new Date(),
      });
    });
    dbMocks.prisma.adminAuditLog.create.mockReset().mockResolvedValue({});
    dbMocks.prisma.$transaction.mockReset().mockImplementation(
      (callback: (transaction: typeof dbMocks.prisma) => unknown) => callback(dbMocks.prisma),
    );
  });

  afterAll(() => vi.unstubAllEnvs());

  const tokenFor = (id: string) => jwt.sign({ sub: id, tv: 0 }, jwtSecret, { algorithm: 'HS256', expiresIn: '1h' });

  it('allows an ADMIN to promote a CUSTOMER and records the change', async () => {
    const response = await request(app)
      .patch('/api/admin/users/customer-1/role')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`)
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(200);
    expect(response.body.data.role).toBe('ADMIN');
    expect(dbMocks.prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'customer-1' },
      data: { role: 'ADMIN' },
    }));
    expect(dbMocks.prisma.adminAuditLog.create).toHaveBeenCalled();
  });

  it('rejects unauthenticated role changes with 401', async () => {
    const response = await request(app)
      .patch('/api/admin/users/customer-1/role')
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(401);
    expect(dbMocks.prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects direct CUSTOMER role-change requests with 403', async () => {
    const response = await request(app)
      .patch('/api/admin/users/customer-1/role')
      .set('Authorization', `Bearer ${tokenFor('customer-1')}`)
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(403);
    expect(dbMocks.prisma.user.update).not.toHaveBeenCalled();
  });

  it('prevents demoting the last administrator', async () => {
    dbMocks.prisma.user.count.mockResolvedValue(1);
    const response = await request(app)
      .patch('/api/admin/users/admin-2/role')
      .set('Authorization', `Bearer ${tokenFor('admin-1')}`)
      .send({ role: 'CUSTOMER' });

    expect(response.status).toBe(409);
    expect(dbMocks.prisma.user.update).not.toHaveBeenCalled();
  });
});
