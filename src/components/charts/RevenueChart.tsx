import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RevenuePoint } from '@/types';

interface RevenueChartProps {
  data: RevenuePoint[];
  title?: string;
}

// Màu series lấy từ token --chart-1 (globals.css) — palette đã validate CVD/contrast.
const SERIES = 'hsl(var(--chart-1))';

export function RevenueChart({ data, title = 'Revenue trend (7 days)' }: RevenueChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0]?.payload as RevenuePoint | undefined;
      return (
        <div className="bg-card/95 border border-border px-4 py-3 rounded-2xl shadow-lg text-xs text-foreground backdrop-blur-md">
          <p className="font-mono font-black text-muted-foreground mb-2 uppercase tracking-widest">{label}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-6">
              <span className="font-bold text-muted-foreground">Revenue:</span>
              <span className="font-mono font-black">{payload[0].value.toLocaleString('vi-VN')} VND</span>
            </div>
            {point?.sessions != null && (
              <div className="flex justify-between items-center gap-6">
                <span className="font-bold text-muted-foreground">Payments:</span>
                <span className="font-mono font-black">{point.sessions}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl glass-premium p-6 shadow-lg border border-sky-100/80 transition-all duration-500 hover:shadow-[0_22px_45px_rgba(37,99,235,0.08)] hover:-translate-y-1 hover:border-blue-500/30 group">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />
      <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.1),transparent_65%)] pointer-events-none blur-2xl" />

      {/* 1 series → không cần legend, title tự nêu tên series. */}
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground font-mono">{title}</h3>
      </div>

      <div className="h-[320px] w-full">
        {!data || data.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm font-semibold text-muted-foreground">No data to display</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={SERIES} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={SERIES} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(14,165,233,0.05)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(14,165,233,0.12)' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(14,165,233,0.12)' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: SERIES, strokeOpacity: 0.25, strokeWidth: 1 }} />
              <Area
                type="monotone"
                name="Revenue (VND)"
                dataKey="revenue"
                stroke={SERIES}
                strokeWidth={2}
                fill="url(#revGrad)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--app-card))', fill: SERIES }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
