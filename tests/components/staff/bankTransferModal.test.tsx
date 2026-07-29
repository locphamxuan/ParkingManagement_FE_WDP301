import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BankTransferModal } from '@/components/staff/parked/BankTransferModal';

const bankTransfer = {
  orderCode: 123,
  checkoutUrl: 'https://pay.example/123',
  amount: 50_000,
  plate: '51F-123.45',
  status: 'success' as const,
};

describe('BankTransferModal', () => {
  it('requires the staff to choose how to collect a late approved penalty', async () => {
    const onPenaltyPaymentMethodChange = vi.fn();

    render(
      <BankTransferModal
        bankTransfer={bankTransfer}
        verifying={false}
        penaltyRequired
        penaltyAmount={100_000}
        penaltyPaymentMethod="cash"
        onPenaltyPaymentMethodChange={onPenaltyPaymentMethodChange}
        onVerify={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Pending penalty: 100.000 đ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collect penalty & complete checkout' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'wallet' }));
    expect(onPenaltyPaymentMethodChange).toHaveBeenCalledWith('wallet');
  });
});
