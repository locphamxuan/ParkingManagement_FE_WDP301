import { useOutletContext } from 'react-router-dom';
import type { StaffBuilding } from '@/services/staff/staffApi';
import type { SubscriptionStatus } from '@/services/manager/managerApi';

export interface BuildingContext {
  buildingId: string;
  building?: StaffBuilding | null;
  subscription?: SubscriptionStatus | null;
  refreshSubscription?: () => void;
}

export function useBuildingContext(): BuildingContext {
  return useOutletContext<BuildingContext>();
}
