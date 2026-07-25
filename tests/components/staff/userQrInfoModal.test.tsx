import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserQrInfoModal } from '@/components/staff/operations/UserQrInfoModal';
import type { StaffOperations } from '@/hooks/staff/useStaffOperations';

// Màn quét QR ở cổng chỉ được hiện tên khách + gói dài hạn của tòa đang chọn.
// Email/số dư ví là PII, không được render kể cả khi lọt vào state.
const opsWith = (userQrInfo: unknown) =>
  ({ userQrInfo, setUserQrInfo: vi.fn() } as unknown as StaffOperations);

describe('UserQrInfoModal', () => {
  it('shows the customer name and their packages', () => {
    render(
      <UserQrInfoModal
        ops={opsWith({
          fullName: 'QR Customer',
          activePackages: [
            { id: 'p1', name: 'Gói tháng', code: 'PKG1', plateNumber: '51F-123.45' },
          ],
        })}
      />,
    );

    expect(screen.getByText('QR Customer')).toBeInTheDocument();
    expect(screen.getByText('Gói tháng')).toBeInTheDocument();
    expect(screen.getByText('51F-123.45')).toBeInTheDocument();
  });

  it('never renders email or wallet balance', () => {
    const { container } = render(
      <UserQrInfoModal
        ops={opsWith({
          fullName: 'QR Customer',
          // Các trường này đã bị loại khỏi kiểu dữ liệu; ép vào để chắc chắn UI
          // không "vô tình" hiển thị nếu backend cũ vẫn trả về.
          email: 'leak@test.com',
          walletBalance: 750000,
          activePackages: [],
        })}
      />,
    );

    expect(container.textContent).not.toContain('leak@test.com');
    expect(container.textContent).not.toContain('750.000');
    expect(screen.queryByText(/wallet balance/i)).not.toBeInTheDocument();
  });

  it('renders nothing when no account was scanned', () => {
    const { container } = render(<UserQrInfoModal ops={opsWith(null)} />);

    expect(container).toBeEmptyDOMElement();
  });
});
