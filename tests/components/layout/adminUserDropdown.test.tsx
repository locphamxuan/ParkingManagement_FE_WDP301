import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AdminUserDropdown } from '@/components/layout/AdminUserDropdown';

function LocationProbe() {
  return <output aria-label="Current route">{useLocation().pathname}</output>;
}

describe('<AdminUserDropdown />', () => {
  it('uses menu semantics and closes with Escape', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AdminUserDropdown
          email="admin@pbms.test"
          fullName="Alex Administrator"
          role="admin"
          onLogout={vi.fn()}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Alex Administrator/i }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('navigates directly to the canonical admin profile route', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AdminUserDropdown
          email="admin@pbms.test"
          fullName="Alex Administrator"
          role="admin"
          onLogout={vi.fn()}
        />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Alex Administrator/i }));
    await user.click(screen.getByRole('menuitem', { name: /View Profile/i }));

    expect(screen.getByRole('status', { name: 'Current route' })).toHaveTextContent('/admin/profile');
  });
});
