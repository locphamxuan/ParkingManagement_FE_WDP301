import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  type BuildingWallet,
  type BuildingWalletTransaction,
  type DailyRevenueResult,
  type RevenueBreakdown,
} from '@/services/manager/managerApi';

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const fmtDay = (s: string) =>
  new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

const TX_REASON_LABELS: Record<string, string> = {
  parking_fee: 'Parking fee',
  reservation_fee: 'Reservation fee',
  topup: 'Top-up',
  refund: 'Refund',
};

export function ManagerWalletPage() {
  const { buildingId } = useBuildingContext();

  const [wallet, setWallet] = useState<BuildingWallet | null>(null);
  const [daily, setDaily] = useState<DailyRevenueResult | null>(null);
  const [breakdown, setBreakdown] = useState<RevenueBreakdown | null>(null);
  const [transactions, setTransactions] = useState<BuildingWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupBusy, setTopupBusy] = useState(false);
  const [pendingTopup, setPendingTopup] = useState<{ orderCode: number; checkoutUrl: string; amount: number } | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const [walletRes, dailyRes, breakdownRes, txRes] = await Promise.all([
        managerApi.wallet.get(buildingId),
        managerApi.wallet.getDailyRevenue(buildingId),
        managerApi.wallet.getRevenueBreakdown(buildingId),
        managerApi.wallet.listTransactions(buildingId),
      ]);
      setWallet((walletRes as { data?: { wallet: BuildingWallet } })?.data?.wallet ?? null);
      setDaily((dailyRes as { data?: DailyRevenueResult })?.data ?? null);
      setBreakdown((breakdownRes as { data?: RevenueBreakdown })?.data ?? null);
      setTransactions((txRes as { data?: { items: BuildingWalletTransaction[] } })?.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleInitiateTopup = useCallback(async () => {
    if (!buildingId) return;
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'err', text: 'Top-up amount must be greater than 0.' });
      return;
    }
    setTopupBusy(true);
    setMessage(null);
    try {
      const res = await managerApi.wallet.initiateTopup(buildingId, amount);
      const data = (res as { data?: { orderCode: number; checkoutUrl: string } })?.data;
      if (data?.checkoutUrl) {
        setPendingTopup({ orderCode: data.orderCode, checkoutUrl: data.checkoutUrl, amount });
        setTopupOpen(false);
        setTopupAmount('');
        window.open(data.checkoutUrl, '_blank', 'noopener');
      }
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Unable to initiate top-up.' });
    } finally {
      setTopupBusy(false);
    }
  }, [buildingId, topupAmount]);

  const handleVerifyTopup = useCallback(async () => {
    if (!buildingId || !pendingTopup) return;
    setTopupBusy(true);
    try {
      const res = await managerApi.wallet.verifyTopup(buildingId, pendingTopup.orderCode);
      const status = (res as { data?: { status?: string } })?.data?.status;
      if (status === 'success') {
        setMessage({ type: 'ok', text: `Topped up ${fmtVnd(pendingTopup.amount)} into the building wallet.` });
        setPendingTopup(null);
        await refresh();
      } else {
        setMessage({ type: 'err', text: 'Payment not received yet. Complete the transaction and try again.' });
      }
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Top-up confirmation failed.' });
    } finally {
      setTopupBusy(false);
    }
  }, [buildingId, pendingTopup, refresh]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw size={14} className="animate-spin" /> Loading building wallet...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet size={22} className="text-primary" />
          <div>
            <h2 className="text-base font-bold text-foreground">Building wallet</h2>
            <p className="text-xs text-muted-foreground">
              All parking revenue is retained 100% in the building wallet.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refresh} className="gap-2 text-xs">
            <RefreshCw size={13} /> Refresh
          </Button>
          <Button onClick={() => setTopupOpen((v) => !v)} className="gap-2 text-xs">
            <Plus size={13} /> Top up
          </Button>
        </div>
      </div>

      {/* Nạp ví tòa nhà (PayOS) */}
      {topupOpen && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card/50 p-4">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Top-up amount (VND)
            </label>
            <Input
              type="number"
              min={1}
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="VD: 500000"
              className="w-48"
            />
          </div>
          <Button onClick={handleInitiateTopup} disabled={topupBusy} className="gap-2">
            {topupBusy ? <RefreshCw size={13} className="animate-spin" /> : <ExternalLink size={13} />}
            Create PayOS payment code
          </Button>
        </div>
      )}

      {pendingTopup && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-300">
            Awaiting payment {fmtVnd(pendingTopup.amount)}. Complete it on the PayOS gateway then confirm.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.open(pendingTopup.checkoutUrl, '_blank', 'noopener')} className="gap-1.5">
              <ExternalLink size={13} /> Reopen gateway
            </Button>
            <Button size="sm" onClick={handleVerifyTopup} disabled={topupBusy} className="gap-1.5">
              {topupBusy ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              I have paid
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {message.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {/* Thẻ tổng quan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Current balance
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">{fmtVnd(wallet?.balance)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Total revenue
            </p>
            <p className="mt-2 text-2xl font-bold text-sky-500">{fmtVnd(breakdown?.allTimeTotal)}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">All-time parking revenue (excludes top-ups)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Revenue today
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{fmtVnd(daily?.totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Doanh thu theo NGÀY × phương thức thanh toán */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp size={15} className="text-primary" />
            Daily revenue by payment method
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!breakdown || breakdown.days.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No revenue in the last 14 days.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 text-left">Date</th>
                    <th className="py-2 text-right">Cash</th>
                    <th className="py-2 text-right">Wallet</th>
                    <th className="py-2 text-right">Bank / QR</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.days.map((d) => (
                    <tr key={d.date} className="border-b border-border/50 last:border-0">
                      <td className="py-2 font-medium text-foreground">{fmtDay(d.date)}</td>
                      <td className="py-2 text-right font-mono text-emerald-600">{fmtVnd(d.byMethod.cash)}</td>
                      <td className="py-2 text-right font-mono text-purple-600">{fmtVnd(d.byMethod.wallet)}</td>
                      <td className="py-2 text-right font-mono text-sky-600">{fmtVnd(d.byMethod.online)}</td>
                      <td className="py-2 text-right font-mono font-bold text-foreground">{fmtVnd(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lịch sử giao dịch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock size={15} className="text-primary" />
            Recent transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No transactions.</p>
          ) : (
            <div className="grid gap-2">
              {transactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isCredit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {isCredit ? <TrendingUp size={13} /> : <ArrowUpRight size={13} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {TX_REASON_LABELS[tx.reason] ?? tx.reason}
                        </p>
                        {tx.note && <p className="text-xs text-muted-foreground">{tx.note}</p>}
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
