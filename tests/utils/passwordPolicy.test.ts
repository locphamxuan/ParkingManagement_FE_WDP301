import { describe, it, expect } from 'vitest';
import { findPasswordWeakness, MIN_PASSWORD_LENGTH } from '@/utils/passwordPolicy';

/**
 * Must stay in lockstep with src/utils/passwordPolicy.js on the backend.
 * The server is authoritative; these only prevent a pointless round trip.
 */
describe('findPasswordWeakness', () => {
  it('requires at least 12 characters', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(12);
    expect(findPasswordWeakness('Abcd3fgh!jk')).toContain('12 characters');
    expect(findPasswordWeakness('Abcd3fgh!jkl')).toBeNull();
  });

  it.each(['123456', 'password', 'Password123', 'admin123', 'matkhau123'])(
    'rejects the common password %s',
    (password) => {
      expect(findPasswordWeakness(password)).toBeTruthy();
    },
  );

  it('rejects a single repeated character', () => {
    expect(findPasswordWeakness('aaaaaaaaaaaa')).toBeTruthy();
  });

  it('rejects a sequential run', () => {
    expect(findPasswordWeakness('123456789012')).toBeTruthy();
    expect(findPasswordWeakness('abcdefghijkl')).toBeTruthy();
  });

  it('accepts a reasonable passphrase', () => {
    expect(findPasswordWeakness('correct-horse-battery')).toBeNull();
    expect(findPasswordWeakness('parking-lot-gate-42')).toBeNull();
  });

  it('treats an empty password as invalid', () => {
    expect(findPasswordWeakness('')).toBeTruthy();
  });
});
