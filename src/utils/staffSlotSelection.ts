interface StaffSlotSelectionInput {
  fixedSlotId?: string | null;
  selectedSlotId?: string | null;
  hasActivePackage: boolean;
  checkInKind: 'package' | 'reservation' | 'standard';
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
