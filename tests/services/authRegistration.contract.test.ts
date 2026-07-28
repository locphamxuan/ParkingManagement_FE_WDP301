import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as authService from '@/services/authService';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      data: {
        token: 'cookie-session',
        user: { _id: 'u1', email: 'a@test.com', fullName: 'A', role: 'user' },
      },
    }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const bodyOf = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body);

describe('OTP registration contract', () => {
  it('never sends the password with the OTP request', async () => {
    await authService.requestRegistration({
      email: 'A@Test.com',
      fullName: '  New User  ',
      phone: '0900000001',
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/users/auth/register-request');
    expect(bodyOf(0)).toEqual({
      email: 'a@test.com',
      fullName: 'New User',
      phone: '0900000001',
    });
    expect(Object.keys(bodyOf(0))).not.toContain('password');
  });

  it('sends the password only with the verified OTP', async () => {
    await authService.verifyRegistration({
      email: 'A@Test.com',
      otp: ' 123456 ',
      password: 'correct-horse-battery',
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/users/auth/register-verify');
    expect(bodyOf(0)).toEqual({
      email: 'a@test.com',
      otp: '123456',
      password: 'correct-horse-battery',
    });
  });

  it('no longer exposes a direct (non-OTP) registration call', () => {
    expect('registerWithBackend' in authService).toBe(false);
  });

  it('does not persist the real JWT in the mapped session', async () => {
    const session = await authService.loginWithBackend({ email: 'a@test.com', password: 'x' });
    expect(session.token).toBe('cookie-session');
  });
});
