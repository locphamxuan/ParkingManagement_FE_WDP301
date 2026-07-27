import { useEffect, useState, useCallback } from 'react';
import { userApi, type Building } from '@/services/user/userApi';
import type { ListFetchState } from './apiState';

// ========== BUILDINGS HOOKS ==========

export function useBuildings(query?: { limit?: number; page?: number }) {
  const [state, setState] = useState<ListFetchState<Building>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchBuildings = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.buildings.list(query);
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

    fetchBuildings();
  }, [query?.page, query?.limit]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.buildings.list(query);
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
