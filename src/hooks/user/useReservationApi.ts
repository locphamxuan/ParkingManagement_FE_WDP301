import { useEffect, useState, useCallback } from 'react';
import {
  userApi,
  type Reservation,
} from '@/services/user/userApi';
import type { FetchState, ListFetchState } from './apiState';

// ========== RESERVATIONS HOOKS ==========

export function useReservations(query?: { status?: string; limit?: number; page?: number }) {
  const [state, setState] = useState<ListFetchState<Reservation>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchReservations = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.reservations.list(query);
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

    fetchReservations();
  }, [query?.page, query?.limit, query?.status]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.reservations.list(query);
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

export function useReservation(id: string) {
  const [state, setState] = useState<FetchState<Reservation>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) return;

    const fetchReservation = async () => {
      setState({ data: null, isLoading: true, error: null });
      try {
        const result = await userApi.reservations.get(id);
        setState({ data: result.data.reservation, isLoading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    };

    fetchReservation();
  }, [id]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.reservations.get(id);
      setState({ data: result.data.reservation, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }, [id]);

  return { ...state, refresh };
}

export function useCreateReservation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (body: {
      plateNumber: string;
      buildingId: string;
      vehicleTypeId?: string;
      vehicleType?: string;
      startTime: string;
      endTime?: string;
      slotId?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await userApi.reservations.create(body);
        return result.data.reservation;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { create, isLoading, error };
}

export function useCancelReservation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancel = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userApi.reservations.cancel(id);
      return result.data.reservation;
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
