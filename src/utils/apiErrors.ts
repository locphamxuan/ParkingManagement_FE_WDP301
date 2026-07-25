import { ApiError } from '@/services/client/apiClient';

/** Trích xuất error code từ BE response payload (vd: 'BUILDING_NO_SLOTS'). */
export function getApiErrorCode(err: unknown): string | undefined {
  if (err instanceof ApiError && err.payload && typeof err.payload === 'object') {
    const payload = err.payload as { errorCode?: string; code?: string };
    return payload.errorCode || payload.code;
  }
  return undefined;
}

/** Map error code → English message; fallback về err.message hoặc default. */
export function resolveErrorMessage(err: unknown, fallback = 'An unexpected error occurred.'): string {
  const code = getApiErrorCode(err);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  return err instanceof Error ? err.message : fallback;
}

const ERROR_MESSAGES: Record<string, string> = {
  // Payment
  INSUFFICIENT_WALLET_BALANCE:
    'Insufficient wallet balance. Please top up and try again.',

  // Long-term subscription
  VEHICLE_CURRENTLY_PARKED:
    'Cannot cancel: your vehicle is currently parked inside. Please exit the parking lot first.',
  CANCELLATION_WINDOW_EXPIRED:
    'Self-cancellation window (3 days from start date) has expired. Please contact the building admin for assistance.',
  FIXED_SLOT_UNAVAILABLE:
    'Your previous fixed slot is no longer available. No fee was deducted. Please choose another fixed slot with a replacement package or contact the building manager.',
  FIXED_SLOT_OCCUPIED:
    'Your fixed slot is currently occupied by a vehicle. Please check the vehicle out first.',
  SLOT_MAINTENANCE_NOT_AVAILABLE:
    'That slot is under maintenance. Please pick another slot.',
  SLOT_NOT_AVAILABLE: 'That slot was just taken. Please pick another slot.',

  // License plate ownership / mutation guards
  PLATE_OWNERSHIP_REQUIRED:
    'That license plate is not registered to your account. Add it to your profile first.',
  PLATE_HAS_ACTIVE_SUBSCRIPTION:
    'This plate has an active long-term package. Cancel or let the package expire before removing the plate.',
  PLATE_HAS_ACTIVE_SESSION:
    'This plate is currently parked. Check the vehicle out before changing it.',
  VEHICLE_TYPE_CONFLICT:
    'Cannot change the vehicle type while this plate has an active package or parking session.',

  // Building availability
  BUILDING_INACTIVE: 'This building is not accepting new entries right now.',
  BUILDING_MAINTENANCE: 'This building is under maintenance — new check-ins are paused.',
  BUILDING_CLOSED: 'This building is outside its operating hours — no new check-ins allowed.',
  INVALID_OPERATING_HOURS:
    'Operating hours must use distinct HH:mm open/close values (e.g. 06:00 / 22:00).',
  BUILDING_REQUIRED: 'Select a building before performing this action.',

  // Staff shift authorization
  NO_ACTIVE_SHIFT: 'You have no active shift right now — gate actions are not allowed.',
  SHIFT_NOT_STARTED: 'Your shift has not started yet. Please wait until your shift window begins.',
  SHIFT_ENDED: 'Your shift has ended. Ask your manager to assign the current shift.',
  SHIFT_BUILDING_MISMATCH: 'Your active shift belongs to another building.',
  ACTIVE_SESSION_NOT_FOUND:
    'No active parking session for this plate in the selected building.',

  // General
  FORBIDDEN_BUILDING_SCOPE: 'You do not have access to this building.',
  USER_FEEDBACK_ONLY: 'Only registered users can submit feedback.',
};
