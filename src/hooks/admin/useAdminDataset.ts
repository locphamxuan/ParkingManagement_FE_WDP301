import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAdminDataset, type AdminDataset } from '@/services/admin';

interface UseAdminDatasetResult {
  data: AdminDataset | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAdminDataset(): UseAdminDatasetResult {
  const { session } = useAuth();
  const [data, setData] = useState<AdminDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Tránh setState sau khi unmount (vd điều hướng đi trong lúc fetch còn treo).
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const token = session?.token;
    if (!token) {
      if (mountedRef.current) {
        setData(null);
        setError('You are not logged in to an admin session.');
        setIsLoading(false);
      }
      return;
    }

    if (mountedRef.current) setIsLoading(true);

    try {
      const result = await getAdminDataset(token);
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load admin data';
      if (mountedRef.current) setError(message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    mountedRef.current = true;
    refresh().catch(() => undefined);

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
