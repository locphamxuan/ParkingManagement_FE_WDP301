import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RevenuePoint } from '@/types';

interface RevenueChartProps {
  data: RevenuePoint[];
  title?: string;
}

const SERIES = '#2563eb';

export function RevenueChart({ data, title = 'Revenue trend' }: RevenueChartProps) {
  return (
    <section className="card-3d glass-premium-deep rounded-2xl border border-slate-200/80 p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">Collected revenue over the last seven days</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">7 days</span>
      </div>
      <div className="h-[300px] w-full">
        {!data?.length ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">No revenue data available.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenue-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={SERIES} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={SERIES} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eaf0f7" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} width={56} />
              <Tooltip
                cursor={{ stroke: SERIES, strokeOpacity: 0.18 }}
                content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                    <p className="text-[11px] font-semibold text-slate-500">{label}</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{Number(payload[0].value || 0).toLocaleString('vi-VN')} ₫</p>
                  </div>
                ) : null}
              />
              <Area type="monotone" dataKey="revenue" stroke={SERIES} strokeWidth={2.5} fill="url(#revenue-area)" activeDot={{ r: 5, fill: SERIES, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
