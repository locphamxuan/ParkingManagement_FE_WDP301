import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('<Button />', () => {
  it('render nội dung con và bắt sự kiện click', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Lưu</Button>);

    const btn = screen.getByRole('button', { name: 'Lưu' });
    expect(btn).toBeInTheDocument();

    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('không kích hoạt onClick khi disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Xóa</Button>);

    const btn = screen.getByRole('button', { name: 'Xóa' });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('áp dụng class biến thể danger + className truyền vào', () => {
    render(<Button variant="danger" className="my-extra">Nguy hiểm</Button>);
    const btn = screen.getByRole('button', { name: 'Nguy hiểm' });
    expect(btn).toHaveClass('my-extra');
    expect(btn.className).toContain('bg-red-500');
  });
});
