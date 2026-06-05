import { useCallback, useEffect, useState } from 'react';
import { managerApi, type SubscriptionStatus } from '@/services/manager/managerApi';

/**
 * Fetches the building's admin-subscription status. Used to gate manager
 * dashboard access — an inactive subscription means the manager can only
 * reach the wallet (to pay) and profile pages.
 */
export function useSubscriptionStatus(buildingId: string | undefined) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!buildingId) {
      setStatus(null);
      return;
    }
    setLoading(true);
    try {
      const res = await managerApi.wallet.getSubscriptionStatus(buildingId);
      setStatus((res as { data?: SubscriptionStatus })?.data ?? null);
    } catch {
      // On error, treat as unknown — do not lock the manager out on a transient failure.
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { status, loading, refresh };
}
