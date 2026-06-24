import { useCallback, useEffect, useMemo } from 'react';
import { useManagerStore } from '@/store/managerStore';

export function useManagerBuildings() {
  const {
    buildings,
    selectedBuildingId,
    selectBuilding,
    loadBuildings,
    isLoading,
    error,
  } = useManagerStore();

  const refreshBuildings = useCallback(async () => {
    try {
      await loadBuildings();
    } catch {
      // handled inside store
    }
  }, [loadBuildings]);

  useEffect(() => {
    // Only load if the list is empty to prevent duplicate API requests on mount/page switch
    if (buildings.length === 0) {
      void refreshBuildings();
    }
  }, [buildings.length, refreshBuildings]);

  const selectedBuilding = useMemo(
    () => buildings.find((building) => building._id === selectedBuildingId) ?? null,
    [buildings, selectedBuildingId],
  );

  return {
    buildings,
    selectedBuildingId: selectedBuildingId || '',
    setSelectedBuildingId: selectBuilding,
    selectedBuilding,
    refreshBuildings,
    isLoading,
    error,
  };
}
