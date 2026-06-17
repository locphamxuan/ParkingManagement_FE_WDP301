import { api } from '@/services/client/apiClient';

export type AppNotificationType =
  | 'checkin_rejected'
  | 'checkout_rejected'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'subscription_slot_released'
  | 'subscription_overage'
  | 'reservation_expired'
  | 'reservation_overstay'
  | 'feedback_reply'
  | 'general';

export interface AppNotification {
  _id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  plateNumber?: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Short labels by notification type (shared by the bell + notifications page). */
export const NOTIFICATION_TYPE_LABEL: Record<AppNotificationType, string> = {
  checkin_rejected: 'Reject entry',
  checkout_rejected: 'Reject exit',
  subscription_expiring: 'Package expiring soon',
  subscription_expired: 'Package expired',
  subscription_slot_released: 'Slot released',
  subscription_overage: 'Package overage',
  reservation_expired: 'Reservation expired',
  reservation_overstay: 'Overstay',
  feedback_reply: 'Review reply',
  general: 'Notifications',
};

type Wrap<T> = { data?: T };

export const notificationApi = {
  list: () =>
    api.get<Wrap<{ items: AppNotification[]; unread: number }>>('/users/notifications'),
  markRead: (id: string) =>
    api.patch<Wrap<AppNotification>>(`/users/notifications/${id}/read`),
  markAllRead: () =>
    api.patch<Wrap<{ ok: boolean }>>('/users/notifications/read-all'),
};
