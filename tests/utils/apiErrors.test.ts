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
