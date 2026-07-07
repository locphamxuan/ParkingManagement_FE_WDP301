import { useEffect, useState, useCallback } from 'react';
import {
  userApi,
  type ParkingHistory,
} from '@/services/user/userApi';
import type { ListFetchState } from './apiState';

// ========== PARKING HISTORY HOOKS ==========

export function useParkingHistory(query?: {
  limit?: number;
  page?: number;
  fromDate?: string;
  toDate?: string;
}) {
  const [state, setState] = useState<ListFetchState<ParkingHistory>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchHistory = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.parkingHistory.list(query);
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

    fetchHistory();
  }, [query?.page, query?.limit, query?.fromDate, query?.toDate]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.parkingHistory.list(query);
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
