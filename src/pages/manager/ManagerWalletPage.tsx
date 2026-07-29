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
  Loader2,
  ShieldAlert,
  Banknote,
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
  type PendingCashPayment,
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
  const [pendingCash, setPendingCash] = useState<PendingCashPayment[]>([]);
  const [penaltyData, setPenaltyData] = useState<{
    allTimePenaltyRevenue: number;
    allTimePenaltyCount: number;
    todayPenaltyRevenue: number;
    todayPenaltyCount: number;
    recentPayments: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupBusy, setTopupBusy] = useState(false);
  const [pendingTopup, setPendingTopup] = useState<{ orderCode: number; checkoutUrl: string; amount: number } | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const [walletRes, dailyRes, breakdownRes, txRes, pendingCashRes, penaltyRes] = await Promise.all([
        managerApi.wallet.get(buildingId),
        managerApi.wallet.getDailyRevenue(buildingId),
        managerApi.wallet.getRevenueBreakdown(buildingId),
        managerApi.wallet.listTransactions(buildingId),
        managerApi.wallet.listPendingCash(buildingId),
        managerApi.wallet.getPenaltyRevenue(buildingId),
      ]);
      setWallet((walletRes as { data?: { wallet: BuildingWallet } })?.data?.wallet ?? null);
      setDaily((dailyRes as { data?: DailyRevenueResult })?.data ?? null);
      setBreakdown((breakdownRes as { data?: RevenueBreakdown })?.data ?? null);
      setTransactions((txRes as { data?: { items: BuildingWalletTransaction[] } })?.data?.items ?? []);
      setPendingCash((pendingCashRes as { data?: { items: PendingCashPayment[] } })?.data?.items ?? []);
      setPenaltyData((penaltyRes as any)?.data ?? null);
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
    if (!pendingTopup || !buildingId) return;
    setTopupBusy(true);
    setMessage(null);
    try {
      const res = await managerApi.wallet.verifyTopup(buildingId, pendingTopup.orderCode);
      const data = (res as { data?: { credited?: boolean; status?: string } })?.data;
      if (data?.credited) {
        setMessage({ type: 'ok', text: 'Top-up succeeded! Wallet balance updated.' });
        setPendingTopup(null);
        refresh();
      } else {
        setMessage({ type: 'err', text: `Verify status: ${data?.status || 'unknown'}. Try again after a moment.` });
      }
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Verify failed' });
    } finally {
      setTopupBusy(false);
    }
  }, [pendingTopup, buildingId, refresh]);

  const handleConfirmCash = async (paymentId: string) => {
    if (!buildingId) return;
    setConfirmingId(paymentId);
    setMessage(null);
    try {
      await managerApi.wallet.confirmCash(buildingId, paymentId);
      setMessage({ type: 'ok', text: 'Cash confirmed successfully and added to building wallet!' });
      refresh();
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Confirm cash failed' });
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-650 text-xs font-bold p-8 justify-center bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-6xl mx-auto">
        <Loader2 size={16} className="animate-spin mr-2" /> Loading building wallet...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              Finance & Balance
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Wallet size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
              Building Wallet
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              All parking revenue is retained 100% in the building wallet.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              variant="outline"
              onClick={refresh}
              className="h-11 px-5 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-200"
            >
              <RefreshCw size={13} className="mr-1.5" /> Refresh
            </Button>
            <Button
              onClick={() => setTopupOpen((v) => !v)}
              className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Plus size={13} className="stroke-[3] mr-1.5" /> Top up
            </Button>
          </div>
        </div>
      </div>

      {/* Nạp ví tòa nhà (PayOS) */}
      {topupOpen && (
        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Top-up amount (VND)
            </label>
            <Input
              type="number"
              min={1}
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="e.g. 500000"
              className="w-56 h-11 rounded-xl bg-white border-blue-105 text-slate-800 focus:border-blue-500/40"
            />
          </div>
          <Button
            onClick={handleInitiateTopup}
            disabled={topupBusy}
            className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-[0.98] gap-2"
          >
            {topupBusy ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} />}
            Create PayOS payment code
          </Button>
        </div>
      )}

      {pendingTopup && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-250 bg-amber-50 px-5 py-4 shadow-sm text-slate-850">
          <p className="text-xs font-bold text-amber-800">
            Awaiting payment {fmtVnd(pendingTopup.amount)}. Complete it on the PayOS gateway then confirm.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(pendingTopup.checkoutUrl, '_blank', 'noopener')}
              className="h-10 px-4 rounded-xl border-amber-200 bg-white text-amber-700 hover:bg-amber-100/50 font-black text-[10px] uppercase tracking-wider shadow-sm"
            >
              <ExternalLink size={12} className="mr-1.5" /> Reopen gateway
            </Button>
            <Button
              size="sm"
              onClick={handleVerifyTopup}
              disabled={topupBusy}
              className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-wider shadow-sm"
            >
              {topupBusy ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <CheckCircle2 size={12} className="mr-1.5" />}
              I have paid
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{error}</p>
      )}

      {message && (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3.5 text-xs font-bold ${
            message.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {message.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {/* Thẻ tổng quan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 border-l-4 border-l-blue-500 bg-white p-5 shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex items-center justify-between group select-none">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Current balance</p>
            <p className="mt-1.5 text-xl font-black text-slate-800 font-mono group-hover:text-blue-755 transition-colors">{fmtVnd(wallet?.balance)}</p>
          </div>
          <div className="p-2.5 rounded-xl border border-blue-100 bg-blue-50/50 text-blue-650 shrink-0">
            <Wallet size={16} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 border-l-4 border-l-sky-500 bg-white p-5 shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex flex-col justify-between group select-none">
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Total revenue</p>
              <p className="mt-1.5 text-xl font-black text-sky-600 font-mono group-hover:text-sky-755 transition-colors">{fmtVnd(breakdown?.allTimeTotal)}</p>
            </div>
            <div className="p-2.5 rounded-xl border border-sky-100 bg-sky-50/50 text-sky-650 shrink-0">
              <TrendingUp size={16} className="stroke-[2.5]" />
            </div>
          </div>
          <p className="mt-2 text-[9px] font-semibold text-slate-400 leading-normal">
            All-time parking revenue (excludes top-ups)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex items-center justify-between group select-none">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Revenue today</p>
            <p className="mt-1.5 text-xl font-black text-emerald-755 font-mono group-hover:text-emerald-800 transition-colors">{fmtVnd(daily?.totalRevenue)}</p>
          </div>
          <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 text-emerald-650 shrink-0">
            <TrendingUp size={16} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Doanh thu tiền phạt vi phạm (Incident Penalty Revenue) */}
      <Card className="border border-rose-100 bg-gradient-to-br from-white via-rose-50/20 to-amber-50/10 shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-rose-100 bg-rose-50/30 p-5">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-600 stroke-[2.5]" />
              Violation Penalty Revenue Stream (Dòng tiền phạt vi phạm)
            </span>
            <span className="text-[10px] font-mono bg-rose-600 text-white px-2 py-0.5 rounded font-black">
              INCIDENT FINES
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-rose-100 bg-white p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">
                All-time penalty revenue collected
              </p>
              <p className="mt-1 text-2xl font-black text-rose-600 font-mono">
                {fmtVnd(penaltyData?.allTimePenaltyRevenue)}
              </p>
              <p className="mt-1 text-[10px] text-slate-400 font-semibold">
                Total settled violations: <strong>{penaltyData?.allTimePenaltyCount ?? 0} cases</strong>
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Today's penalty revenue
              </p>
              <p className="mt-1 text-2xl font-black text-amber-600">
                {fmtVnd(penaltyData?.todayPenaltyRevenue)}
              </p>
              <p className="mt-1 text-[10px] text-slate-400 font-semibold">
                Settled today: <strong>{penaltyData?.todayPenaltyCount ?? 0} cases</strong>
              </p>
            </div>
          </div>

          {penaltyData?.recentPayments && penaltyData.recentPayments.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Recent violation fine collections
              </p>
              <div className="divide-y divide-rose-50 rounded-xl border border-rose-100 bg-white">
                {penaltyData.recentPayments.map((p: any) => (
                  <div key={p._id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Banknote size={13} className="text-rose-500" />
                        {p.incident?.code || 'INCIDENT'} — {p.incident?.type || 'Violation Fine'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Target: {p.incident?.target || '—'} | Collected by: {p.staff?.fullName || 'Staff'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-rose-600">{fmtVnd(p.amount)}</p>
                      <p className="text-[9px] uppercase font-bold text-slate-400">{p.method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tiền mặt chờ Manager thu nhận */}
      <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30 p-5">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-blue-600 stroke-[2.5]" />
            Pending Cash Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {pendingCash.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">No pending cash collections to approve.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-2 text-left">Staff Name</th>
                    <th className="py-2 text-left">Collection Details</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCash.map((pay) => (
                    <tr key={pay._id} className="border-b border-slate-100/50 last:border-0">
                      <td className="py-3 font-semibold text-slate-800">
                        {pay.staff?.fullName || 'Shift Staff'}
                        <p className="text-[10px] text-slate-400 font-mono font-normal">{pay.staff?.email}</p>
                      </td>
                      <td className="py-3 text-slate-600 text-xs">
                        <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-black uppercase text-slate-600 mr-2">
                          {pay.type === 'session' ? 'Parking' : pay.type}
                        </span>
                        {pay.note || 'Cash payment at gate'}
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{fmtTime(pay.createdAt)}</p>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-800">{fmtVnd(pay.amount)}</td>
                      <td className="py-3 text-center">
                        <Button
                          size="sm"
                          disabled={confirmingId === pay._id}
                          onClick={() => handleConfirmCash(pay._id)}
                          className="h-11 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-650 px-3 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm hover:brightness-110"
                        >
                          {confirmingId === pay._id ? (
                            <Loader2 size={10} className="animate-spin" />
                          ) : (
                            'Confirm Receipt'
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Doanh thu theo NGÀY × phương thức thanh toán */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp size={15} className="text-primary" />
            Daily revenue by payment method
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!breakdown || !breakdown.days || breakdown.days.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No revenue in the last 14 days.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Cash</th>
                    <th className="px-4 py-3 text-right">Wallet</th>
                    <th className="px-4 py-3 text-right">Bank / QR</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breakdown.days.map((d: any) => (
                    <tr key={d.date} className="hover:bg-blue-500/[0.02] transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">{fmtDay(d.date)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmtVnd(d.byMethod.cash)}</td>
                      <td className="px-4 py-3 text-right font-bold text-purple-600">{fmtVnd(d.byMethod.wallet)}</td>
                      <td className="px-4 py-3 text-right font-bold text-sky-600">{fmtVnd(d.byMethod.online)}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">{fmtVnd(d.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lịch sử giao dịch */}
      <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30 p-5">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Clock size={14} className="text-blue-600 stroke-[2.5]" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {transactions.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="grid gap-3">
              {transactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 text-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isCredit ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isCredit ? <TrendingUp size={12} className="stroke-[2.5]" /> : <ArrowUpRight size={12} className="stroke-[2.5]" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {TX_REASON_LABELS[tx.reason] ?? tx.reason}
                        </p>
                        {tx.note && <p className="text-xs text-slate-450 font-medium">{tx.note}</p>}
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          Balance: <span className="font-bold text-slate-700">{fmtVnd(tx.balanceAfter)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-extrabold text-sm ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isCredit ? '+' : '-'}{fmtVnd(tx.amount)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{fmtTime(tx.createdAt)}</p>
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
