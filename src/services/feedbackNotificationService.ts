import { api } from '@/services/client/apiClient';

export interface FeedbackTargetItem {
  _id?: string;
  id?: string;
  code?: string;
  plateNumber?: string;
  building?: { name?: string; code?: string; address?: unknown } | string | null;
  entryTime?: string;
  exitTime?: string;
  startTime?: string;
  endTime?: string;
  fee?: number;
  estimatedFee?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PendingFeedbackTarget {
  type?: 'parkingSession' | 'reservation' | string;
  parkingSessionId?: string;
  reservationId?: string;
  item?: FeedbackTargetItem;
  _id?: string;
  id?: string;
}

export interface PendingFeedbackResponse {
  count: number;
  items: PendingFeedbackTarget[];
}

export interface SubmitFeedbackPayload {
  parkingSessionId?: string;
  reservationId?: string;
  rating: number;
  categories: string[];
  comment: string;
}

export interface UserNotification {
  _id: string;
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  body?: string;
  isRead?: boolean;
  read?: boolean;
  feedback?: string | { _id?: string; rating?: number; comment?: string; staffReply?: string };
  feedbackId?: string;
  createdAt?: string;
  timestamp?: string;
}

function unwrapData<T>(payload: any, fallback: T): T {
  return (payload?.data ?? payload ?? fallback) as T;
}

/**
 * The backend has no dedicated "pending feedback" endpoint. We derive it on the
 * client: completed parking sessions that the user has not reviewed yet
 * (parking-history minus the sessions already present in their feedback list).
 */
export async function fetchPendingFeedback(): Promise<PendingFeedbackResponse> {
  const [histPayload, fbPayload] = await Promise.all([
    api.get<any>('/users/parking-history', { query: { limit: 50 } }),
    api.get<any>('/users/feedbacks/me', { query: { limit: 100 } }),
  ]);

  const sessions: any[] = unwrapData<any>(histPayload, { items: [] })?.items ?? [];
  const feedbacks: any[] = unwrapData<any>(fbPayload, { items: [] })?.items ?? [];

  const reviewedIds = new Set(
    feedbacks
      .map((f) => (f?.parkingSession && typeof f.parkingSession === 'object' ? f.parkingSession._id : f?.parkingSession))
      .filter(Boolean)
      .map((id: unknown) => String(id)),
  );

  const items: PendingFeedbackTarget[] = sessions
    .filter((s) => s?.status === 'completed' && !reviewedIds.has(String(s?._id)))
    .map((s) => ({
      type: 'parkingSession' as const,
      parkingSessionId: String(s._id),
      item: {
        _id: String(s._id),
        plateNumber: s.plateNumber,
        building: s.building,
        entryTime: s.checkIn ?? s.check_in ?? s.entryTime,
        exitTime: s.checkOut ?? s.check_out ?? s.exitTime,
        fee: s.fee,
        status: s.status,
        createdAt: s.createdAt,
      },
    }));

  return { count: items.length, items };
}

export async function submitFeedback(payload: SubmitFeedbackPayload) {
  return api.post('/users/feedbacks', payload);
}

export async function fetchUserNotifications(): Promise<{ items: UserNotification[]; unread: number }> {
  const payload = await api.get<any>('/users/notifications');
  const data = unwrapData<any>(payload, { items: [], unread: 0 });
  const items = Array.isArray(data?.items) ? data.items : [];
  const unread = Number(data?.unread ?? items.filter((item: UserNotification) => item.isRead === false || item.read === false).length ?? 0);
  return { items, unread };
}

export async function markNotificationRead(id: string) {
  return api.patch(`/users/notifications/${id}/read`);
}
