import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userApi } from '@/services/user/userApi';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({ success: true, data: {} }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('user API contract', () => {
  it('uses backend field names when submitting feedback', async () => {
    await userApi.feedbacks.create({
      building: 'building-1',
      parkingSession: 'session-1',
      rating: 5,
      comment: 'Everything was smooth.',
    });

    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request.body)).toEqual({
      building: 'building-1',
      parkingSession: 'session-1',
      rating: 5,
      comment: 'Everything was smooth.',
    });
  });

  it('uses the backend-supported building filter for public feedback', async () => {
    await userApi.feedbacks.listAll({ building: 'building-1', rating: 4 });

    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/users/feedbacks?building=building-1&rating=4',
    );
  });
});
