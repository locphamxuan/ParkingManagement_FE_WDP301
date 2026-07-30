import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CheckoutModal } from '@/components/staff/parked/CheckoutModal';
import type { LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import type { ParkingSession } from '@/services/staff/staffApi';

const IMG = 'data:image/jpeg;base64,AAAA';

const session = {
  _id: 'sess-1',
  plateNumber: '51F-123.45',
  entryTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  status: 'active',
  currentFee: 20_000,
  plateImage: IMG,
  portraitImage: IMG,
} as unknown as ParkingSession;

const renderModal = (capturedPlateImage: string | null) =>
  render(
    <CheckoutModal
      checkoutTarget={session}
      userLabel="Staff A"
      coStep={2}
      setCoStep={vi.fn()}
      capturedPlateImage={capturedPlateImage}
      capturedPortraitImage={IMG}
      setCapturedPortraitImage={vi.fn()}
      portraitCamRef={createRef<LiveCameraHandle>()}
      paymentMethod="cash"
      setPaymentMethod={vi.fn()}
      pendingPenalties={{}}
      loading={false}
      onClose={vi.fn()}
      onCheckOut={vi.fn()}
      onOpenReject={vi.fn()}
      onCaptureError={vi.fn()}
    />,
  );

describe('CheckoutModal evidence comparison', () => {
  it('compares portraits only when the vehicle was identified without a plate scan', () => {
    renderModal(null);

    expect(screen.getByText('Compare portrait photos')).toBeInTheDocument();
    expect(screen.queryAllByText('Plate')).toHaveLength(0);
    expect(screen.getAllByText('Portrait')).toHaveLength(2);
    expect(screen.getByText(/verify the driver portrait only/i)).toBeInTheDocument();
  });

  it('keeps the plate comparison when an exit plate photo was captured', () => {
    renderModal(IMG);

    expect(screen.getByText('Compare plate & portrait photos')).toBeInTheDocument();
    expect(screen.getAllByText('Plate')).toHaveLength(2);
    expect(screen.queryByText(/verify the driver portrait only/i)).not.toBeInTheDocument();
  });
});
