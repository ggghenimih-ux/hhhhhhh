import express from 'express';
import request from 'supertest';
import { Prisma } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../server/middleware/errorHandler';

const firebaseMocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  getApps: vi.fn(() => []),
  initializeApp: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  hashPassword: vi.fn(),
  generateToken: vi.fn(),
  setAuthCookie: vi.fn((res: express.Response, token: string) =>
    res.cookie('gsm_token', token, { httpOnly: true }),
  ),
}));

vi.mock('firebase-admin/app', () => ({
  getApps: firebaseMocks.getApps,
  initializeApp: firebaseMocks.initializeApp,
}));

vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: firebaseMocks.verifyIdToken }),
}));

vi.mock('../server/db/client', () => ({
  prisma: {
    user: {
      findUnique: firebaseMocks.findUnique,
      create: firebaseMocks.create,
      update: firebaseMocks.update,
    },
  },
}));

vi.mock('../server/services/authService', () => ({
  hashPassword: firebaseMocks.hashPassword,
  generateToken: firebaseMocks.generateToken,
  setAuthCookie: firebaseMocks.setAuthCookie,
}));

describe('Firebase authentication endpoint', () => {
  let app: express.Express;

  beforeAll(async () => {
    vi.stubEnv('FIREBASE_PROJECT_ID', 'test-firebase-project');
    vi.stubEnv('RETURN_TOKEN_IN_BODY', 'false');
    const { firebaseLogin } = await import('../server/controllers/firebaseAuthController');
    app = express();
    app.use(express.json());
    app.post('/api/auth/firebase', firebaseLogin);
    app.use(errorHandler);
  });

  beforeEach(() => {
    firebaseMocks.verifyIdToken.mockReset();
    firebaseMocks.findUnique.mockReset();
    firebaseMocks.create.mockReset();
    firebaseMocks.update.mockReset();
    firebaseMocks.hashPassword.mockReset().mockResolvedValue('hashed-random-password');
    firebaseMocks.generateToken.mockReset().mockReturnValue('server-jwt');
    firebaseMocks.setAuthCookie.mockClear();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('returns 401 for an invalid Firebase ID token', async () => {
    firebaseMocks.verifyIdToken.mockRejectedValue(new Error('invalid token'));

    const response = await request(app)
      .post('/api/auth/firebase')
      .send({ idToken: 'a-valid-length-token-value' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Unauthorized',
      message: 'Jeton Firebase invalide ou expiré.',
    });
  });

  it('returns 403 when the Firebase email is not verified', async () => {
    firebaseMocks.verifyIdToken.mockResolvedValue({
      email: 'customer@example.com',
      email_verified: false,
    });

    const response = await request(app)
      .post('/api/auth/firebase')
      .send({ idToken: 'a-valid-length-token-value' });

    expect(response.status).toBe(403);
    expect(firebaseMocks.findUnique).not.toHaveBeenCalled();
  });

  it('creates a verified CUSTOMER, issues a cookie, and omits the token from JSON', async () => {
    const createdUser = {
      id: 'new-user-id',
      name: 'New Customer',
      email: 'new.customer@example.com',
      phone: '',
      role: 'CUSTOMER',
      emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      tokenVersion: 0,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      passwordHash: 'must-not-be-returned',
    };
    firebaseMocks.verifyIdToken.mockResolvedValue({
      email: ' New.Customer@Example.COM ',
      email_verified: true,
      name: 'New Customer',
    });
    firebaseMocks.findUnique.mockResolvedValue(null);
    firebaseMocks.create.mockResolvedValue(createdUser);

    const response = await request(app)
      .post('/api/auth/firebase')
      .send({ idToken: 'a-valid-length-token-value' });

    expect(response.status).toBe(200);
    expect(firebaseMocks.findUnique).toHaveBeenCalledWith({
      where: { email: 'new.customer@example.com' },
    });
    expect(firebaseMocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'New Customer',
        email: 'new.customer@example.com',
        phone: '',
        role: 'CUSTOMER',
        emailVerifiedAt: expect.any(Date),
        passwordHash: 'hashed-random-password',
      }),
    });
    expect(firebaseMocks.hashPassword).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(firebaseMocks.generateToken).toHaveBeenCalledWith({
      id: 'new-user-id',
      role: 'CUSTOMER',
      tokenVersion: 0,
    });
    const cookieHeader = response.headers['set-cookie'];
    expect(Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader).toContain('gsm_token=server-jwt');
    expect(response.body).toMatchObject({
      success: true,
      user: { id: 'new-user-id', role: 'CUSTOMER' },
      data: { id: 'new-user-id', role: 'CUSTOMER' },
    });
    expect(response.body).not.toHaveProperty('token');
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(response.body.data).not.toHaveProperty('passwordHash');
  });

  it('does not allow an administrator to sign in through Firebase', async () => {
    firebaseMocks.verifyIdToken.mockResolvedValue({
      email: 'admin@example.com',
      email_verified: true,
    });
    firebaseMocks.findUnique.mockResolvedValue({
      id: 'admin-id',
      name: 'Administrator',
      email: 'admin@example.com',
      phone: '',
      role: 'ADMIN',
      emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      tokenVersion: 0,
    });

    const response = await request(app)
      .post('/api/auth/firebase')
      .send({ idToken: 'a-valid-length-token-value' });

    expect(response.status).toBe(403);
    expect(firebaseMocks.create).not.toHaveBeenCalled();
    expect(firebaseMocks.generateToken).not.toHaveBeenCalled();
    expect(firebaseMocks.setAuthCookie).not.toHaveBeenCalled();
  });

  it('returns a JSON service error when the database schema is stale', async () => {
    firebaseMocks.verifyIdToken.mockResolvedValue({
      email: 'customer@example.com',
      email_verified: true,
    });
    firebaseMocks.findUnique.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('The column is missing.', {
        code: 'P2022',
        clientVersion: 'test',
        meta: { modelName: 'User', column: 'main.users.emailVerifiedAt' },
      }),
    );

    const response = await request(app)
      .post('/api/auth/firebase')
      .send({ idToken: 'a-valid-length-token-value' });

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: 'ServiceUnavailable',
      message: 'La base de données nécessite une mise à jour avant cette opération.',
    });
  });

  it('invalidates local credentials the first time Firebase verifies an existing email', async () => {
    const existingUser = {
      id: 'existing-user-id',
      name: 'Existing User',
      email: 'customer@example.com',
      phone: '',
      role: 'CUSTOMER',
      emailVerifiedAt: null,
      tokenVersion: 3,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const verifiedUser = { ...existingUser, emailVerifiedAt: new Date(), tokenVersion: 4 };
    firebaseMocks.verifyIdToken.mockResolvedValue({
      email: existingUser.email,
      email_verified: true,
    });
    firebaseMocks.findUnique.mockResolvedValue(existingUser);
    firebaseMocks.update.mockResolvedValue(verifiedUser);

    const response = await request(app)
      .post('/api/auth/firebase')
      .send({ idToken: 'a-valid-length-token-value' });

    expect(response.status).toBe(200);
    expect(firebaseMocks.update).toHaveBeenCalledWith({
      where: { id: 'existing-user-id' },
      data: {
        passwordHash: 'hashed-random-password',
        emailVerifiedAt: expect.any(Date),
        tokenVersion: { increment: 1 },
      },
    });
    expect(firebaseMocks.generateToken).toHaveBeenCalledWith({
      id: 'existing-user-id',
      role: 'CUSTOMER',
      tokenVersion: 4,
    });
  });

  it.each([
    ['missing idToken', {}],
    ['short idToken', { idToken: 'too-short' }],
  ])('returns 400 for a %s', async (_case, body) => {
    const response = await request(app)
      .post('/api/auth/firebase')
      .send(body);

    expect(response.status).toBe(400);
    expect(firebaseMocks.verifyIdToken).not.toHaveBeenCalled();
  });
});
