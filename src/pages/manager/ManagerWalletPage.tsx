import { useCallback, useEffect, useState } from 'react';
import {
  Wallet, TrendingUp, ArrowUpRight, RefreshCw, AlertTriangle,
  Clock, CreditCard, CheckCircle2, Star, Loader2, X, Plus, QrCode,
  ShieldAlert, ShieldCheck,
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
  type AdminSubscriptionPackage,
} from '@/services/manager/managerApi';

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('en-US')} ₫` : '—';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });

const REASON_LABEL: Record<string, string> = {
  parking_fee: 'Parking Fee',
  reservation_fee: 'Reservation Fee',
  reservation_deposit: 'Reservation Deposit',
  transfer_to_system: 'Transfer to Admin',
  admin_subscription: 'Admin Subscription',
  topup: 'Wallet Top-up',
  refund: 'Refund',
};

export function ManagerWalletPage() {
  const { buildingId, subscription, refreshSubscription } = useBuildingContext();

  const [wallet, setWallet] = useState<BuildingWallet | null>(null);
  const [daily, setDaily] = useState<DailyRevenueResult | null>(null);
  const [transactions, setTransactions] = useState<BuildingWalletTransaction[]>([]);
  const [packages, setPackages] = useState<AdminSubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  // Top-up state
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupResult, setTopupResult] = useState<{ checkoutUrl: string; qrCode: string; orderCode: number } | null>(null);
  const [verifyingOrderCode, setVerifyingOrderCode] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const [walletRes, dailyRes, txRes, pkgRes] = await Promise.all([
        managerApi.wallet.get(buildingId),
        managerApi.wallet.getDailyRevenue(buildingId),
        managerApi.wallet.listTransactions(buildingId),
        managerApi.wallet.listSubscriptionPackages(buildingId),
      ]);
      setWallet((walletRes as any)?.data?.wallet ?? null);
      setDaily((dailyRes as any)?.data ?? null);
      setTransactions((txRes as any)?.data?.items ?? []);
      setPackages((pkgRes as any)?.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-verify when returning from the PayOS payment page (?topup=success&orderCode=...).
  useEffect(() => {
    if (!buildingId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('topup') !== 'success') return;
    const oc = Number(params.get('orderCode'));
    // Clear the query string so a refresh doesn't re-trigger verification.
    window.history.replaceState({}, '', window.location.pathname);
    if (!oc) return;
    (async () => {
      try {
        const res = await managerApi.wallet.verifyTopup(buildingId, oc);
        if ((res as any)?.data?.status === 'success') {
          setSuccessMsg('Top-up successful! Wallet balance updated.');
          refresh();
        }
      } catch {
        /* manager can still verify manually via the "I've Paid" button */
      }
    })();
  }, [buildingId, refresh]);

  const handleSubscribe = async (pkg: AdminSubscriptionPackage) => {
    if (!window.confirm(`Subscribe to "${pkg.name}" for ${fmtVnd(pkg.price)}?\n\nThis will deduct ${fmtVnd(pkg.price)} from your building wallet and transfer it to the admin wallet.`)) return;
    setSubscribingId(pkg._id);
    setError(null);
    try {
      const res = await managerApi.wallet.subscribe(buildingId, pkg._id);
      setWallet((res as any)?.data?.wallet ?? wallet);
      setSuccessMsg(`Successfully subscribed to "${pkg.name}". ${fmtVnd(pkg.price)} transferred to admin wallet. Dashboard unlocked!`);
      refresh();
      refreshSubscription?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setSubscribingId(null);
    }
  };

  const subscriptionTxs = transactions.filter((tx) => tx.reason === 'admin_subscription');

  const handleTopup = async () => {
    const amt = parseInt(topupAmount.replace(/\D/g, ''), 10);
    if (!amt || amt < 2000) { setError('Minimum top-up is 2,000 ₫'); return; }
    setTopupLoading(true);
    setError(null);
    try {
      const res = await managerApi.wallet.initiateTopup(buildingId, amt);
      setTopupResult((res as any)?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Top-up failed');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleVerify = async (orderCode: number) => {
    setVerifyingOrderCode(orderCode);
    try {
      const res = await managerApi.wallet.verifyTopup(buildingId, orderCode);
      const data = (res as any)?.data;
      if (data?.status === 'success') {
        setSuccessMsg('Top-up successful! Wallet balance updated.');
        setTopupResult(null);
        setTopupAmount('');
        setShowTopup(false);
        refresh();
      } else {
        setError(`Payment not confirmed yet (status: ${data?.status ?? 'pending'}). Please complete payment first.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifyingOrderCode(null);
    }
  };

  const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000];

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
            <p className="text-xs text-muted-foreground">Revenue tracking and system subscriptions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setShowTopup((v) => !v); setTopupResult(null); }} className="gap-2 text-xs">
            <Plus size={13} /> Top Up Wallet
          </Button>
          <Button variant="secondary" onClick={refresh} className="gap-2 text-xs">
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>
      </div>

      {/* Subscription status banner */}
      {subscription && (
        subscription.active ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <ShieldCheck size={16} className="shrink-0 text-emerald-400" />
            <span className="font-semibold">
              Subscription active{subscription.packageName ? ` — ${subscription.packageName}` : ''}.
            </span>
            <span className="text-emerald-200/80">
              Valid until {new Date(subscription.endDate as string).toLocaleDateString('en-US', { dateStyle: 'medium' } as Intl.DateTimeFormatOptions)} ({subscription.daysRemaining} day{subscription.daysRemaining === 1 ? '' : 's'} left).
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-400" />
            <div>
              <p className="font-bold text-amber-100">Dashboard locked — no active subscription</p>
              <p className="mt-0.5 text-amber-200/85">
                Top up your wallet below, then purchase a package. The dashboard unlocks immediately after subscribing.
              </p>
            </div>
          </div>
        )
      )}

      {/* Top-up panel */}
      {showTopup && !topupResult && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <CreditCard size={15} className="text-orange-400" />
              Top Up Building Wallet via PayOS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(String(amt))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-black transition ${
                    topupAmount === String(amt)
                      ? 'border-orange-500 bg-orange-500/15 text-orange-400'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20'
                  }`}
                >
                  {fmtVnd(amt)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter amount (min 2,000 ₫)"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleTopup} disabled={topupLoading} className="gap-2 shrink-0">
                {topupLoading ? <><Loader2 size={13} className="animate-spin" /> Processing...</> : <><QrCode size={13} /> Get QR</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PayOS payment info */}
      {topupResult && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <QrCode size={15} className="text-emerald-400" />
                Scan to Pay — {fmtVnd(parseInt(topupAmount))}
              </CardTitle>
              <button onClick={() => setTopupResult(null)} className="text-muted-foreground hover:text-white">
                <X size={14} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topupResult.qrCode && (
              <div className="flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(topupResult.qrCode)}&size=200x200&bgcolor=ffffff`}
                  alt="VietQR"
                  className="rounded-xl border border-white/10"
                  width={200}
                  height={200}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 gap-2 text-xs"
                onClick={() => window.open(topupResult.checkoutUrl, '_blank')}
              >
                <CreditCard size={12} /> Open Payment Page
              </Button>
              <Button
                className="flex-1 gap-2 text-xs"
                onClick={() => handleVerify(topupResult.orderCode)}
                disabled={verifyingOrderCode === topupResult.orderCode}
              >
                {verifyingOrderCode === topupResult.orderCode
                  ? <><Loader2 size={12} className="animate-spin" /> Verifying...</>
                  : <><CheckCircle2 size={12} /> I've Paid</>}
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              Order #{topupResult.orderCode} · Complete payment then click "I've Paid"
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertTriangle size={14} className="shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={13} /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 size={14} className="shrink-0" /> {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Balance</p>
            <p className="mt-2 text-2xl font-bold text-white">{fmtVnd(wallet?.balance)}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Today's Revenue</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{fmtVnd(daily?.totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* System Subscription Packages — only shown when there is no active subscription.
          An active manager just sees their status banner above (no "buy package" prompt). */}
      {!subscription?.active && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <Star size={15} className="text-amber-400" />
              System Subscription Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {packages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subscription packages available from admin.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {packages.map((pkg) => (
                  <div key={pkg._id}
                    className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col gap-3">
                    <div>
                      <p className="font-bold text-white text-sm">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-amber-400 font-bold">{fmtVnd(pkg.price)}</span>
                      <span className="text-muted-foreground">{pkg.durationDays} days</span>
                    </div>
                    {pkg.features.length > 0 && (
                      <ul className="text-xs text-slate-400 space-y-0.5">
                        {pkg.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 size={10} className="text-emerald-400 shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleSubscribe(pkg)}
                      disabled={subscribingId === pkg._id}
                      className="gap-2 text-xs w-full"
                    >
                      {subscribingId === pkg._id
                        ? <><Loader2 size={12} className="animate-spin" /> Processing...</>
                        : <><CreditCard size={12} /> Subscribe</>}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription history */}
      {subscriptionTxs.length > 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <Star size={15} className="text-amber-400" />
              Subscription History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {subscriptionTxs.map((tx) => (
                <div key={tx._id}
                  className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                      <Star size={13} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Admin Subscription</p>
                      <p className="text-xs text-muted-foreground">Balance after: {fmtVnd(tx.balanceAfter)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-rose-400">-{fmtVnd(tx.amount)}</p>
                    <p className="text-xs text-muted-foreground">{fmtTime(tx.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  <div key={tx._id}
                    className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                        ${isCredit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                        {isCredit ? <TrendingUp size={13} /> : <ArrowUpRight size={13} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {REASON_LABEL[tx.reason] ?? tx.reason}
                        </p>
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
