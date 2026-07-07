import { useEffect, useState, useCallback } from 'react';
import {
  userApi,
  type Building,
  type VehicleType,
  type ParkingSlot,
  type FloorAvailability,
} from '@/services/user/userApi';
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

export function useBuildingVehicleTypes(buildingId: string) {
  const [state, setState] = useState<ListFetchState<VehicleType>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!buildingId) {
      setState({ items: [], isLoading: false, error: null });
      return;
    }

    const fetchVehicleTypes = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.buildings.vehicleTypes(buildingId);
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

    fetchVehicleTypes();
  }, [buildingId]);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.buildings.vehicleTypes(buildingId);
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
        error: error instanceof Error ? error : new Error('Unknown   error'),
      }));
    }
  }, [buildingId]);

  return { ...state, refresh };
}

export function useBuildingFloors(buildingId: string, query?: { vehicleTypeId?: string }) {
  const [state, setState] = useState<ListFetchState<FloorAvailability>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!buildingId) {
      setState({ items: [], isLoading: false, error: null });
      return;
    }

    const fetchFloors = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.buildings.floors(buildingId, query);
        setState({
          items: result.data.floors,
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

    fetchFloors();
  }, [buildingId, query?.vehicleTypeId]);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.buildings.floors(buildingId, query);
      setState({
        items: result.data.floors,
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
  }, [buildingId, query?.vehicleTypeId]);

  return { ...state, refresh };
}

export function useBuildingSlots(buildingId: string, floorId: string, query?: { limit?: number; page?: number }) {
  const [state, setState] = useState<ListFetchState<ParkingSlot>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!buildingId || !floorId) {
      setState({ items: [], isLoading: false, error: null });
      return;
    }

    const fetchSlots = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.buildings.slots(buildingId, floorId);
        setState({
          items: result.data.slots,
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

    fetchSlots();
  }, [buildingId, floorId, query?.page, query?.limit]);

  const refresh = useCallback(async () => {
    if (!buildingId || !floorId) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.buildings.slots(buildingId, floorId);
      setState({
        items: result.data.slots,
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
  }, [buildingId, floorId, query]);

  return { ...state, refresh };
}
