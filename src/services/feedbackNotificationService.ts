import { api } from '@/services/apiClient';

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

export async function fetchPendingFeedback(): Promise<PendingFeedbackResponse> {
  const payload = await api.get<any>('/users/feedbacks/pending');
  const data = unwrapData<any>(payload, { count: 0, items: [] });
  const items = Array.isArray(data?.items) ? data.items : [];
  return { count: Number(data?.count ?? items.length ?? 0), items };
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
