import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackToTopButton } from '@/components/home/BackToTopButton';

describe('<BackToTopButton />', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('appears after scrolling and returns the page to the top', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    render(<BackToTopButton />);

    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();

    window.scrollY = 800;
    fireEvent.scroll(window);

    await userEvent.click(screen.getByRole('button', { name: 'Back to top' }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
