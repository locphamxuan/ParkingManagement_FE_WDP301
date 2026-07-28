import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import type { PublicReview } from '@/services/user/userApi';

const makeReview = (id: string, comment: string): PublicReview => ({
  id,
  rating: 4,
  comment,
  building: { id: 'building-1', name: 'Sunrise Tower', code: 'SRT' },
  staffReply: null,
  repliedAt: null,
  status: 'resolved',
  createdAt: '2026-06-12T08:00:00.000Z',
  updatedAt: '2026-06-12T08:00:00.000Z',
});

const baseProps = {
  loading: false,
  selectedBuilding: 'all',
  selectedRating: 'all',
  onWriteReview: vi.fn(),
  page: 1,
  totalPages: 1,
  loadReviews: vi.fn(),
};

describe('<ReviewsList />', () => {
  it('renders every review without a delete control', () => {
    render(
      <ReviewsList
        {...baseProps}
        reviews={[makeReview('r1', 'Great lot'), makeReview('r2', 'Very clean')]}
      />,
    );

    expect(screen.getByText('Great lot')).toBeInTheDocument();
    expect(screen.getByText('Very clean')).toBeInTheDocument();
    expect(screen.queryByTitle('Delete review')).not.toBeInTheDocument();
  });

  it('keeps the write-a-review affordance on the empty state', () => {
    render(<ReviewsList {...baseProps} reviews={[]} />);

    expect(screen.getByRole('button', { name: /write the first review/i })).toBeInTheDocument();
  });
});
