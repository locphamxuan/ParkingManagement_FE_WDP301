import { useCallback, useEffect, useState } from 'react';
import { Wallet, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminApi, type SystemWallet, type WalletDistribution } from '@/services/admin/adminApi';

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('en-US')} ₫` : '—';
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });

export function SystemWalletPage() {
  const [wallet, setWallet] = useState<SystemWallet | null>(null);
  const [distributions, setDistributions] = useState<WalletDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, distRes] = await Promise.all([
        adminApi.wallet.get(),
        adminApi.wallet.distributions(),
      ]);
      setWallet((walletRes as any)?.data?.wallet ?? null);
      setDistributions((distRes as any)?.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw size={14} className="animate-spin" /> Loading system wallet...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet size={22} className="text-orange-400" />
          <div>
            <h2 className="text-base font-bold text-white">System Wallet</h2>
            <p className="text-xs text-muted-foreground">
              Platform-level wallet — receives 30% daily revenue transfers from all buildings
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={refresh} className="gap-2 text-xs">
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Current Balance
            </p>
            <p className="mt-2 text-3xl font-bold text-white">
              {fmtVnd(wallet?.balance)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated: {wallet?.updatedAt ? fmtTime(wallet.updatedAt) : '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70">
              Total Distributed to Buildings
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-400">
              {fmtVnd(wallet?.totalDistributed)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cumulative amount distributed out by admin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution history */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <TrendingDown size={15} className="text-orange-400" />
            Distribution History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {distributions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No distributions yet.</p>
          ) : (
            <div className="grid gap-2">
              {distributions.map((d) => (
                <div
                  key={d._id}
                  className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {d.building?.code} · {d.building?.name}
                    </p>
                    {d.note && (
                      <p className="text-xs text-muted-foreground">{d.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{fmtTime(d.createdAt)}</p>
                  </div>
                  <p className="font-mono font-bold text-amber-400">
                    -{fmtVnd(d.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
