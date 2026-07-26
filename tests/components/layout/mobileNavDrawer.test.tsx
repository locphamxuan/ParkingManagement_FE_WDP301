import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileNavButton, MobileNavDrawer } from '@/components/layout/MobileNavDrawer';

function DrawerHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MobileNavButton onOpen={() => setOpen(true)} />
      <MobileNavDrawer open={open} onClose={() => setOpen(false)}>
        <a href="/dashboard">Dashboard</a>
      </MobileNavDrawer>
    </>
  );
}

describe('<MobileNavDrawer />', () => {
  it('closes with Escape and restores focus to its trigger', async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);

    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Portal navigation' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
