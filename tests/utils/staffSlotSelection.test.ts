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

  // Đặt chỗ theo giờ đã bị gỡ khỏi sản phẩm: chỉ còn HAI nhóm check-in. Kiểu
  // StaffCheckInKind chặn nhánh thứ ba ở compile-time; test này chốt hành vi runtime.
  it('only supports the package and standard check-in kinds', () => {
    const kinds = (['package', 'standard'] as const).map((checkInKind) => ({
      checkInKind,
      ...resolveStaffSlotSelection({
        fixedSlotId: null,
        selectedSlotId: 'slot-1',
        hasActivePackage: checkInKind === 'package',
        checkInKind,
      }),
    }));

    expect(kinds).toEqual([
      { checkInKind: 'package', assignedSlotId: 'slot-1', fixedSlotId: '', needsSlotSelection: true },
      { checkInKind: 'standard', assignedSlotId: 'slot-1', fixedSlotId: '', needsSlotSelection: true },
    ]);
  });
});
