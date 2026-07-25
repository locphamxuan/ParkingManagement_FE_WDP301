import { describe, expect, it } from 'vitest';
import { resolveStaffSlotSelection } from '@/utils/staffSlotSelection';

describe('resolveStaffSlotSelection', () => {
  it('keeps a fixed package slot authoritative over mutable selection state', () => {
    expect(resolveStaffSlotSelection({
      fixedSlotId: 'fixed-slot',
      selectedSlotId: '',
      hasActivePackage: true,
      checkInKind: 'package',
    })).toEqual({
      assignedSlotId: 'fixed-slot',
      fixedSlotId: 'fixed-slot',
      needsSlotSelection: false,
    });
  });

  it('requires staff selection for a floating package', () => {
    expect(resolveStaffSlotSelection({
      fixedSlotId: null,
      selectedSlotId: '',
      hasActivePackage: true,
      checkInKind: 'package',
    })).toMatchObject({
      assignedSlotId: '',
      needsSlotSelection: true,
    });
  });

  it('uses the selected slot for standard check-in', () => {
    expect(resolveStaffSlotSelection({
      fixedSlotId: null,
      selectedSlotId: 'universal-slot',
      hasActivePackage: false,
      checkInKind: 'standard',
    })).toMatchObject({
      assignedSlotId: 'universal-slot',
      needsSlotSelection: true,
    });
  });
});
