import { useOutletContext } from 'react-router-dom';
import type { StaffBuilding } from '@/services/staff/staffApi';

export interface BuildingContext {
  buildingId: string;
  building?: StaffBuilding | null;
}

export function useBuildingContext(): BuildingContext {
  return useOutletContext<BuildingContext>();
}
