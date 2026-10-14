import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMocks = vi.hoisted(() => ({
  sendPasswordResetEmail: vi.fn(),
  getAuth: vi.fn(() => ({})),
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/app', () => ({
  initializeApp: firebaseMocks.initializeApp,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: firebaseMocks.getAuth,
  sendPasswordResetEmail: firebaseMocks.sendPasswordResetEmail,
}));

import { sendPasswordResetEmail } from '../src/services/firebase';

describe('Firebase password reset', () => {
  beforeEach(() => {
    firebaseMocks.sendPasswordResetEmail.mockReset().mockResolvedValue(undefined);
  });

  it('sends the reset email to the normalized address', async () => {
    await sendPasswordResetEmail('  Customer@Example.com ');

    expect(firebaseMocks.sendPasswordResetEmail).toHaveBeenCalledWith({}, 'customer@example.com');
  });

  it('does not reveal when Firebase has no account for the address', async () => {
    firebaseMocks.sendPasswordResetEmail.mockRejectedValue(
      Object.assign(new Error('User not found'), { code: 'auth/user-not-found' }),
    );

    await expect(sendPasswordResetEmail('customer@example.com')).resolves.toBeUndefined();
  });

  it('surfaces other Firebase errors to the UI', async () => {
    const error = Object.assign(new Error('Too many requests'), { code: 'auth/too-many-requests' });
    firebaseMocks.sendPasswordResetEmail.mockRejectedValue(error);

    await expect(sendPasswordResetEmail('customer@example.com')).rejects.toBe(error);
  });
});
