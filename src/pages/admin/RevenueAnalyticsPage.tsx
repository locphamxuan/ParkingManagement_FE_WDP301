import { useCallback, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Coins,
  CreditCard,
  Calendar,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi, type RevenueReport } from '@/services/admin/adminApi';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const fmtVnd = (n: number | undefined | null) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export function RevenueAnalyticsPage() {
  const [from, setFrom] = useState(() => isoDay(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.revenue.report({ from, to });
      setReport((res as { data?: RevenueReport })?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load revenue report.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  const stats = useMemo(() => {
    if (!report?.items) return { totalSessions: 0, cashlessRate: 0, activeBuildings: 0 };
    let totalSessions = 0;
    let cash = 0;
    let cashless = 0;
    report.items.forEach((r) => {
      totalSessions += r.sessionCount || 0;
      cash += r.cashAmount || 0;
      cashless += (r.walletAmount || 0) + (r.qrAmount || 0);
    });
    const total = cash + cashless;
    const cashlessRate = total > 0 ? Math.round((cashless / total) * 100) : 0;
    const activeBuildings = report.items.length;
    return { totalSessions, cashlessRate, activeBuildings };
  }, [report]);

  const channelData = useMemo(() => {
    if (!report?.items) return [];
    let cash = 0;
    let wallet = 0;
    let qr = 0;
    report.items.forEach((r) => {
      cash += r.cashAmount || 0;
      wallet += r.walletAmount || 0;
      qr += r.qrAmount || 0;
    });
    return [
      { name: 'E-wallet', value: wallet, color: '#3b82f6' },
      { name: 'QR Pay', value: qr, color: '#8b5cf6' },
      { name: 'Cash', value: cash, color: '#f59e0b' },
    ].filter(item => item.value > 0);
  }, [report]);

  return (
    <div className="space-y-6 pb-12">
      {/* Control Actions Row (Search, filter, create button) grouped together beautifully */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 w-full rounded-3xl border border-sky-100/50 bg-white/30 p-4 shadow-sm backdrop-blur-md relative overflow-hidden">
        {/* Decorative subtle top edge line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-500/10 via-blue-500/30 to-indigo-500/10" />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-655 flex items-center justify-center font-bold shrink-0 border border-blue-500/15">
            <Coins size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 leading-tight">Parking revenue by building</h3>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
              Payment cash-flow breakdown
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-white/90 border border-sky-100/80 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar size={13} className="text-slate-400" />
            <span className="text-[9px] font-black uppercase text-slate-400 mr-1">From</span>
            <input 
              type="date" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
              className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:outline-none focus:ring-0 w-28 p-0"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-white/90 border border-sky-100/80 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar size={13} className="text-slate-400" />
            <span className="text-[9px] font-black uppercase text-slate-400 mr-1">To</span>
            <input 
              type="date" 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              className="bg-transparent border-0 text-xs font-bold text-slate-700 focus:outline-none focus:ring-0 w-28 p-0"
            />
          </div>
          <Button 
            onClick={loadReport} 
            className="bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-550 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-white rounded-xl font-black px-5 py-2.5 h-10 text-xs border-0 shadow-md flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-600 shadow-sm animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 font-bold p-12 justify-center">
          <RefreshCw size={16} className="animate-spin text-blue-500" /> Aggregating revenue data...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Analytics Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Grand Total Revenue */}
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 shadow-sm hover:shadow-emerald-500/10 transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500/10 via-emerald-500 to-teal-400/10 opacity-60" />
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
                  <Coins size={20} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total revenue</p>
                  <p className="text-base font-black text-emerald-650 mt-0.5">{fmtVnd(report?.grandTotal)}</p>
                </div>
              </div>
            </div>

            {/* Total Sessions */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-5 shadow-sm hover:shadow-blue-500/10 transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500/10 via-blue-500 to-sky-400/10 opacity-60" />
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-500/20">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total parking sessions</p>
                  <p className="text-base font-black text-slate-800 mt-0.5">{stats.totalSessions} sessions</p>
                </div>
              </div>
            </div>

            {/* Cashless rate */}
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-5 shadow-sm hover:shadow-purple-500/10 transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500/10 via-purple-500 to-indigo-400/10 opacity-60" />
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-650 flex items-center justify-center font-bold shrink-0 border border-purple-500/20">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Cashless</p>
                  <p className="text-base font-black text-purple-650 mt-0.5">{stats.cashlessRate}%</p>
                </div>
              </div>
            </div>

            {/* Active buildings */}
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 shadow-sm hover:shadow-amber-500/10 transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-amber-500/10 via-amber-500 to-orange-400/10 opacity-60" />
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-500/20">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active buildings</p>
                  <p className="text-base font-black text-slate-800 mt-0.5">{stats.activeBuildings} building(s)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Double Column Display */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
            {/* Payment Channel Pie Chart Card */}
            <div className="relative overflow-hidden rounded-3xl border border-sky-100/60 bg-white/45 p-6 shadow-md flex flex-col justify-between xl:col-span-2">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/30 to-indigo-500/10" />
              <div>
                <h4 className="font-extrabold text-sm text-slate-800 leading-tight">Payment channel distribution</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Revenue share by cash flow</p>
              </div>

              {channelData.length === 0 ? (
                <div className="py-24 text-center text-xs text-slate-400 italic">No revenue yet</div>
              ) : (
                <div className="mt-6 flex-grow flex flex-col justify-center">
                  <div className="h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={6}
                          dataKey="value"
                          cornerRadius={6}
                        >
                          {channelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(15, 20, 40, 0.92)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 'bold',
                          }}
                          formatter={(value: number) => [fmtVnd(value), 'Doanh thu']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Sales</span>
                      <span className="text-xs font-black text-slate-700 mt-1 leading-none">100%</span>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6 border-t border-sky-100/30 pt-4">
                    {channelData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm animate-pulse" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-500 font-bold">{item.name}</span>
                        </div>
                        <span className="font-extrabold text-slate-800">{fmtVnd(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Buildings List (No Nested Wrapper Card) */}
            <div className="xl:col-span-3 space-y-4">
              <div>
                <h4 className="font-extrabold text-sm text-slate-850 leading-tight">Building sales report</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Detailed parking revenue statistics</p>
              </div>

              {!report?.items?.length ? (
                <div className="rounded-3xl border border-sky-100/60 bg-white/45 p-12 text-center text-xs text-slate-400 italic shadow-md">
                  No revenue in this period.
                </div>
              ) : (
                <div className="space-y-4">
                  {report.items.map((r) => {
                    const total = r.totalRevenue || 1;
                    const cashPct = Math.round(((r.cashAmount || 0) / total) * 100);
                    const walletPct = Math.round(((r.walletAmount || 0) / total) * 100);
                    const qrPct = Math.round(((r.qrAmount || 0) / total) * 100);

                    return (
                      <motion.div
                        key={r.buildingId}
                        whileHover={{ scale: 1.005, y: -2 }}
                        className="rounded-3xl border border-sky-100/60 bg-white/45 p-6 shadow-md hover:border-blue-500/15 transition-all duration-200 group relative overflow-hidden"
                      >
                        {/* Top Accent line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/25 to-indigo-500/10" />

                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-650 flex items-center justify-center font-bold shrink-0 border border-blue-500/15">
                              <Building2 size={16} />
                            </div>
                            <div>
                              <h5 className="font-extrabold text-xs text-slate-800 leading-tight">{r.buildingName ?? 'Building'}</h5>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1 font-mono">{r.buildingCode || r.buildingId.slice(0, 8)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-xs text-emerald-650 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg inline-block">
                              {fmtVnd(r.totalRevenue)}
                            </span>
                            <p className="text-[9px] text-slate-450 font-bold mt-1.5 uppercase tracking-wider">{r.sessionCount} parking sessions</p>
                          </div>
                        </div>

                        {/* Revenue Stacked bar graph simulating channel split */}
                        <div className="space-y-3">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 flex shadow-inner">
                            {r.walletAmount > 0 && (
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-sky-400 transition-all" 
                                style={{ width: `${walletPct}%` }}
                                title={`E-wallet: ${walletPct}%`}
                              />
                            )}
                            {r.qrAmount > 0 && (
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all" 
                                style={{ width: `${qrPct}%` }}
                                title={`QR Pay: ${qrPct}%`}
                              />
                            )}
                            {r.cashAmount > 0 && (
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all" 
                                style={{ width: `${cashPct}%` }}
                                title={`Cash: ${cashPct}%`}
                              />
                            )}
                          </div>

                          {/* Channel labels */}
                          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-450 mt-1 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                            <span className="flex items-center gap-1.5 justify-center border-r border-slate-200/50 last:border-r-0">
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-sm" />
                              Wallet: <span className="text-slate-700 font-extrabold">{fmtVnd(r.walletAmount)}</span>
                            </span>
                            <span className="flex items-center gap-1.5 justify-center border-r border-slate-200/50 last:border-r-0">
                              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0 shadow-sm" />
                              QR: <span className="text-slate-700 font-extrabold">{fmtVnd(r.qrAmount)}</span>
                            </span>
                            <span className="flex items-center gap-1.5 justify-center border-r border-slate-200/50 last:border-r-0">
                              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 shadow-sm" />
                              Cash: <span className="text-slate-700 font-extrabold">{fmtVnd(r.cashAmount)}</span>
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
