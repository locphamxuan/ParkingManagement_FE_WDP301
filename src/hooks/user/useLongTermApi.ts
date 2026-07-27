import { useEffect, useState, useCallback } from 'react';
import { userApi, type LongTermSubscription } from '@/services/user/userApi';
import type { ListFetchState } from './apiState';

// ========== LONG-TERM SUBSCRIPTIONS HOOKS ==========

export function useLongTermSubscriptions(query?: {
  status?: string;
  limit?: number;
  page?: number;
}) {
  const [state, setState] = useState<ListFetchState<LongTermSubscription>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.longTermSubscriptions.list(query);
        setState({
          items: result.data.items,
          pagination: result.data.pagination,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        }));
      }
    };

    fetchSubscriptions();
  }, [query?.page, query?.limit, query?.status]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.longTermSubscriptions.list(query);
      setState({
        items: result.data.items,
        pagination: result.data.pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, [query]);

  return { ...state, refresh };
}

export function useRenewSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const renew = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userApi.longTermSubscriptions.renew(id);
      return result.data.subscription;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { renew, isLoading, error };
}

export function useCancelSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancel = useCallback(async (id: string, cancelReason?: string, cancelNote?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userApi.longTermSubscriptions.cancel(id, {
        cancelReason: cancelReason || 'change_slot',
        cancelNote,
      });
      return result.data.subscription;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { cancel, isLoading, error };
}

/** Preview refund %/amount for a subscription BEFORE the user confirms cancellation. */
export function useRefundPreview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPreview = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userApi.longTermSubscriptions.refundPreview(id);
      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchPreview, isLoading, error };
}
