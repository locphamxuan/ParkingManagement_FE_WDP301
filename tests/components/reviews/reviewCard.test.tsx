import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import type { PublicReview } from '@/services/user/userApi';

/**
 * The public feed only ever contains `resolved` reviews, and the backend
 * refuses to delete resolved feedback — so a delete control here could only
 * ever produce "400 Cannot delete a resolved feedback". It must stay absent.
 */
const review: PublicReview = {
  id: 'review-1',
  rating: 5,
  comment: 'Fast check-out and clean parking area.',
  building: { id: 'building-1', name: 'Sunrise Tower', code: 'SRT' },
  staffReply: 'Thank you for the kind words.',
  repliedAt: '2026-06-12T10:00:00.000Z',
  status: 'resolved',
  createdAt: '2026-06-12T08:00:00.000Z',
  updatedAt: '2026-06-12T10:00:00.000Z',
};

describe('<ReviewCard />', () => {
  it('renders the review content', () => {
    render(<ReviewCard item={review} />);

    expect(screen.getByText('Fast check-out and clean parking area.')).toBeInTheDocument();
    expect(screen.getByText('Sunrise Tower')).toBeInTheDocument();
    expect(screen.getByText('Thank you for the kind words.')).toBeInTheDocument();
  });

  it('renders no delete action at all', () => {
    const { container } = render(<ReviewCard item={review} />);

    expect(screen.queryByTitle('Delete review')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/delete/i);
  });

  it('shows no reviewer identity', () => {
    const { container } = render(<ReviewCard item={review} />);

    expect(screen.getByText('Verified customer')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    // The reply is attributed to the operator, never to a named person.
    expect(screen.getByText(/Reply from the parking operator/i)).toBeInTheDocument();
  });

  it('accepts only the public DTO — no PII fields exist to render', () => {
    // A compile-time guarantee mirrored at runtime: nothing on PublicReview can
    // carry a user, plate, session or image URL.
    expect(Object.keys(review)).toEqual([
      'id',
      'rating',
      'comment',
      'building',
      'staffReply',
      'repliedAt',
      'status',
      'createdAt',
      'updatedAt',
    ]);
  });
});
