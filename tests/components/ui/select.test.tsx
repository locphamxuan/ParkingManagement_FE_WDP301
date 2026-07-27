import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomSelect } from '@/components/ui/select';

const options = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
];

describe('<CustomSelect />', () => {
  it('exposes radio menu semantics and closes with Escape', async () => {
    const user = userEvent.setup();
    render(
      <CustomSelect
        ariaLabel="Vehicle type"
        value="car"
        onChange={vi.fn()}
        options={options}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Vehicle type' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(2);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('selects an option with the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CustomSelect
        ariaLabel="Vehicle type"
        value="car"
        onChange={onChange}
        options={options}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Vehicle type' });
    trigger.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('motorcycle');
  });
});
