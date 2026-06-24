import { useCallback, useEffect, useState } from 'react';
import {
  fetchPendingFeedback,
  fetchUserNotifications,
  markNotificationRead,
  submitFeedback,
  type PendingFeedbackResponse,
  type SubmitFeedbackPayload,
  type UserNotification,
} from '@/services/feedbackNotificationService';

export function useFeedbackPending(enabled = true) {
  const [data, setData] = useState<PendingFeedbackResponse>({ count: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchPendingFeedback();
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending reviews');
      setData({ count: 0, items: [] });
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, error, refresh };
}

export function useSubmitFeedback() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: SubmitFeedbackPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitFeedback(payload);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit review';
      setError(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submit, submitting, error };
}

export function useUserNotifications(enabled = true) {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserNotifications();
      setItems(data.items);
      setUnread(data.unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      setItems([]);
      setUnread(0);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setItems((current) => current.map((item) => (item._id === id || item.id === id ? { ...item, isRead: true, read: true } : item)));
    setUnread((value) => Math.max(0, value - 1));
  }, []);

  useEffect(() => {
    refresh();
    if (!enabled) return;
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  return { items, unread, loading, error, refresh, markRead };
}
