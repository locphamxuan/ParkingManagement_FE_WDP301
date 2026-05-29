import { useCallback, useEffect, useState } from 'react';
import { Wallet, TrendingUp, ArrowUpRight, RefreshCw, AlertTriangle, CheckCircle2, Clock, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  type BuildingWallet,
  type BuildingWalletTransaction,
  type DailyRevenueResult,
  type DailyRevenueSettlement,
} from '@/services/manager/managerApi';

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('en-US')} ₫` : '—';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });

const REASON_LABEL: Record<string, string> = {
  parking_fee: 'Parking Fee',
  reservation_fee: 'Reservation Fee',
  transfer_to_system: 'Transfer to Admin',
  refund: 'Refund',
};

export function ManagerWalletPage() {
  const { buildingId } = useBuildingContext();

  const [wallet, setWallet] = useState<BuildingWallet | null>(null);
  const [daily, setDaily] = useState<DailyRevenueResult | null>(null);
  const [transactions, setTransactions] = useState<BuildingWalletTransaction[]>([]);
  const [settlements, setSettlements] = useState<DailyRevenueSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const [walletRes, dailyRes, txRes, settleRes] = await Promise.all([
        managerApi.wallet.get(buildingId),
        managerApi.wallet.getDailyRevenue(buildingId),
        managerApi.wallet.listTransactions(buildingId),
        managerApi.wallet.listSettlements(buildingId),
      ]);
      setWallet((walletRes as any)?.data?.wallet ?? null);
      setDaily((dailyRes as any)?.data ?? null);
      setTransactions((txRes as any)?.data?.items ?? []);
      setSettlements((settleRes as any)?.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw size={14} className="animate-spin" /> Loading wallet...
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
            <h2 className="text-base font-bold text-white">Building Wallet</h2>
            <p className="text-xs text-muted-foreground">
              Revenue tracking and automatic admin settlement
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Current Balance
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {fmtVnd(wallet?.balance)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Today's Revenue
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {fmtVnd(daily?.totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70">
              Projected 30% — auto-settled daily
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-400">
              {fmtVnd(daily?.targetTransfer)}
            </p>
            <p className="mt-2 text-xs text-amber-400/70">
              Transfers to the admin wallet automatically.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-400">
        <span className="font-semibold">How it works: </span>
        30% of each day's total revenue is automatically transferred to the system (admin) wallet at the start of the next day. The remaining 70% stays in your building wallet. No manual action is needed.
      </div>

      {/* Auto-settlement history */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <CalendarCheck size={15} className="text-amber-400" />
            Auto-Settlement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No settlements yet. Days are settled automatically once completed.
            </p>
          ) : (
            <div className="grid gap-2">
              {settlements.map((s) => {
                const shortfall = s.transferredAmount < s.targetAmount;
                return (
                  <div
                    key={s._id}
                    className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                        <CheckCircle2 size={13} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{s.date}</p>
                        <p className="text-xs text-muted-foreground">
                          Revenue: {fmtVnd(s.revenue)} · 30% = {fmtVnd(s.targetAmount)}
                        </p>
                        {shortfall && s.note && (
                          <p className="text-xs text-rose-400">{s.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-amber-400">
                        -{fmtVnd(s.transferredAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">to admin</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm text-white">
            <Clock size={15} className="text-orange-400" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="grid gap-2">
              {transactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                          ${isCredit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}
                      >
                        {isCredit ? <TrendingUp size={13} /> : <ArrowUpRight size={13} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {REASON_LABEL[tx.reason] ?? tx.reason}
                        </p>
                        {tx.note && (
                          <p className="text-xs text-muted-foreground">{tx.note}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Balance after: {fmtVnd(tx.balanceAfter)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'}{fmtVnd(tx.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtTime(tx.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
