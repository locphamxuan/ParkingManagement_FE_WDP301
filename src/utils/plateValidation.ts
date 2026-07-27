import { normalizePlate, isValidVietnamPlate } from '@/utils/plate';

// ─── Vietnamese license plate validation (shared util — canonical 59G2-038.80) ─
// Series must be letter+digit (59G2) or two letters (30LD); a bare single letter
// like `59G` is rejected. Number group is 4–5 digits (5-digit → NNN.NN).
export interface PlateValidationResult {
  ok: boolean;
  error?: string;
}

export function validatePlate(
  raw: string,
  existingPlates: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle' }>,
): PlateValidationResult {
  // Step 1: empty check
  if (!raw || raw.trim() === '') {
    return { ok: false, error: 'Please enter a plate number.' };
  }

  // Step 2: normalize to canonical VN form + format check
  const plate = normalizePlate(raw);
  if (!isValidVietnamPlate(plate)) {
    return {
      ok: false,
      error: 'Invalid plate format. Valid examples: 59G2-03880 or 59G2-038.80.',
    };
  }

  // Step 3: duplicate check
  if (existingPlates.some((p) => p.plateNumber.toUpperCase() === plate)) {
    return { ok: false, error: `Plate "${plate}" has been added.` };
  }

  return { ok: true };
}
