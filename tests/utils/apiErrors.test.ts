import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/client/apiClient';
import { getApiErrorCode, resolveErrorMessage } from '@/utils/apiErrors';

describe('apiErrors', () => {
  it('reads the backend errorCode field', () => {
    const error = new ApiError('slot unavailable', 409, {
      errorCode: 'FIXED_SLOT_UNAVAILABLE',
      details: { requiresSlotSelection: true },
    });

    expect(getApiErrorCode(error)).toBe('FIXED_SLOT_UNAVAILABLE');
    expect(resolveErrorMessage(error)).toContain('No fee was deducted');
  });

  it('maps building availability and shift authorization codes', () => {
    const closed = new ApiError('Building is closed', 409, { errorCode: 'BUILDING_CLOSED' });
    const notStarted = new ApiError('Shift not started', 403, { errorCode: 'SHIFT_NOT_STARTED' });

    expect(resolveErrorMessage(closed)).toContain('operating hours');
    expect(resolveErrorMessage(notStarted)).toContain('shift');
  });

  it('maps plate mutation guard codes', () => {
    const active = new ApiError('plate in use', 409, {
      errorCode: 'PLATE_HAS_ACTIVE_SUBSCRIPTION',
    });

    expect(resolveErrorMessage(active)).toContain('long-term package');
  });

  it('maps cross-building access denial instead of showing the raw backend text', () => {
    const denied = new ApiError(
      'Forbidden: You do not have permission to manage this specific building.',
      403,
      { errorCode: 'BUILDING_ACCESS_DENIED' },
    );

    const message = resolveErrorMessage(denied);
    expect(message).toContain('not assigned to this building');
    expect(message).not.toContain('Forbidden:');
  });

  it('maps the manager building-status guard', () => {
    const forbidden = new ApiError('nope', 403, { errorCode: 'BUILDING_STATUS_FORBIDDEN' });

    expect(resolveErrorMessage(forbidden)).toContain('active and maintenance');
  });

  it('leaves existing shift-denial mappings unchanged', () => {
    const cases: Array<[string, string]> = [
      ['NO_ACTIVE_SHIFT', 'no active shift'],
      ['SHIFT_NOT_STARTED', 'has not started'],
      ['SHIFT_BUILDING_MISMATCH', 'another building'],
      ['FORBIDDEN_BUILDING_SCOPE', 'do not have access to this building'],
    ];

    for (const [code, expected] of cases) {
      expect(resolveErrorMessage(new ApiError('raw', 403, { errorCode: code }))).toContain(expected);
    }
  });

  it('falls back to the server message for unmapped codes', () => {
    const unknown = new ApiError('Server said no', 400, { errorCode: 'SOME_NEW_CODE' });

    expect(resolveErrorMessage(unknown)).toBe('Server said no');
  });

  it('keeps compatibility with legacy code responses', () => {
    const error = new ApiError('forbidden', 403, {
      code: 'FORBIDDEN_BUILDING_SCOPE',
    });

    expect(getApiErrorCode(error)).toBe('FORBIDDEN_BUILDING_SCOPE');
  });
});
