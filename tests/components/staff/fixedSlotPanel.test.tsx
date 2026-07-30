import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FixedSlotPanel } from '@/components/staff/operations/FixedSlotPanel';
import { MultiCamCheckIn } from '@/components/staff/operations/MultiCamCheckIn';
import type { StaffOperations } from '@/hooks/staff/useStaffOperations';

describe('FixedSlotPanel', () => {
  it('shows the reserved bay and its floor', () => {
    render(<FixedSlotPanel slot={{ code: 'DDKP-02', floor: { name: 'B1' } }} packageName="Gói ô tô 1 tuần" />);

    expect(screen.getByText('DDKP-02 · Floor B1')).toBeInTheDocument();
    expect(screen.getByText(/Gói ô tô 1 tuần/)).toBeInTheDocument();
    expect(screen.getByText(/no selection needed/i)).toBeInTheDocument();
  });

  it('renders without a floor when the bay has none', () => {
    render(<FixedSlotPanel slot={{ code: 'A-01', floor: null }} />);

    expect(screen.getByText('A-01')).toBeInTheDocument();
  });
});

/**
 * A package bay bought up front makes `needsSlotSelection` false, so anything
 * rendered inside the zone/slot picker is unreachable for exactly the customers
 * it is meant to inform. These assert the panel sits outside that gate.
 */
const baseOps = {
  buildingId: 'b1',
  loading: false,
  plateNumber: '64A-040.75',
  setPlateNumber: vi.fn(),
  vehicleBrand: 'Ford',
  vehicleType: 'car' as const,
  setVehicleType: vi.fn(),
  plateCamRef: createRef(),
  qrCamRef: createRef(),
  portraitCamRef: createRef(),
  assignment: {},
  distinctDeviceCount: 2,
  multiCamMode: true,
  identificationMethod: 'plate' as const,
  freeSlots: [],
  selectedSlotId: '',
  setSelectedSlotId: vi.fn(),
  selectedZoneId: '',
  setSelectedZoneId: vi.fn(),
  availableZones: [],
  setRejectOpen: vi.fn(),
  allowedTypes: ['CAR', 'MOTORCYCLE'],
  plateTypeWarning: null,
  buildingSupportWarning: null,
  isMotorcycle: false,
  slotUsageType: 'subscriber' as const,
  selectedZone: null,
  zoneUsageBlocked: false,
  zoneUsageFallback: false,
  hasExactZoneFree: false,
  slotPoolState: 'ok' as const,
  slotSelectionBlocked: false,
  handlePlateDetected: vi.fn(),
  handleResolveIdQr: vi.fn(),
  onCheckIn: vi.fn(),
  vehicleTypeMismatch: false,
};

const renderMultiCam = (over: Partial<StaffOperations>) =>
  render(<MultiCamCheckIn ops={{ ...baseOps, ...over } as unknown as StaffOperations} />);

describe('MultiCamCheckIn slot guidance', () => {
  it('shows the reserved bay for a package vehicle that bought a fixed slot', () => {
    renderMultiCam({
      hasActivePackage: true,
      checkInKind: 'package',
      needsSlotSelection: false,
      fixedPackageSlot: { code: 'DDKP-02', floor: { name: 'B1' } },
      plateAccountInfo: { activePackage: { name: 'Gói ô tô 1 tuần' } } as StaffOperations['plateAccountInfo'],
    });

    expect(screen.getByText('DDKP-02 · Floor B1')).toBeInTheDocument();
    expect(screen.queryByText('-- Zone --')).not.toBeInTheDocument();
  });

  it('asks staff to pick a zone for a package vehicle with no fixed slot', () => {
    renderMultiCam({
      hasActivePackage: true,
      checkInKind: 'package',
      needsSlotSelection: true,
      fixedPackageSlot: null,
      freeSlots: [{ _id: 's1', code: 'A-01', zone: { _id: 'z1', code: 'Z1', usageType: 'subscriber' } }],
      availableZones: [{ _id: 'z1', code: 'Z1', usageType: 'subscriber', count: 1 }],
      plateAccountInfo: { activePackage: { name: 'Gói ô tô 1 tuần' } } as StaffOperations['plateAccountInfo'],
    });

    expect(screen.getByText('-- Zone --')).toBeInTheDocument();
    expect(screen.queryByText(/no selection needed/i)).not.toBeInTheDocument();
  });

  it.each([
    ['registered member without a package', 'registered'],
    ['walk-in guest', 'walk_in'],
  ])('asks staff to pick from the manager-configured pool for a %s', (_label, usageType) => {
    renderMultiCam({
      hasActivePackage: false,
      checkInKind: 'standard',
      needsSlotSelection: true,
      fixedPackageSlot: null,
      slotUsageType: usageType as StaffOperations['slotUsageType'],
      freeSlots: [{ _id: 's1', code: 'A-01', zone: { _id: 'z1', code: 'Z1', usageType } }],
      availableZones: [{ _id: 'z1', code: 'Z1', usageType, count: 1 }],
      plateAccountInfo: null,
    });

    expect(screen.getByText('-- Zone --')).toBeInTheDocument();
    expect(screen.queryByText(/no selection needed/i)).not.toBeInTheDocument();
  });
});
