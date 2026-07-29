/**
 * Chỉ có HAI nhóm check-in: xe có gói dài hạn đang hiệu lực (`package`) và xe
 * thường (`standard`). BE là nơi quyết định gói có hiệu lực hay không.
 */
export type StaffCheckInKind = 'package' | 'standard';

interface StaffSlotSelectionInput {
  fixedSlotId?: string | null;
  selectedSlotId?: string | null;
  hasActivePackage: boolean;
  checkInKind: StaffCheckInKind;
}

export function resolveStaffSlotSelection({
  fixedSlotId,
  selectedSlotId,
  hasActivePackage,
  checkInKind,
}: StaffSlotSelectionInput) {
  const normalizedFixedSlotId = fixedSlotId || '';
  const assignedSlotId = normalizedFixedSlotId || selectedSlotId || '';
  const needsSlotSelection =
    (hasActivePackage && !normalizedFixedSlotId) || checkInKind === 'standard';

  return {
    assignedSlotId,
    fixedSlotId: normalizedFixedSlotId,
    needsSlotSelection,
  };
}
