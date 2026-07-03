import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RevenuePoint } from '@/types';

interface RevenueChartProps {
  data: RevenuePoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Customized 3D Glowing HTML Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-orange-500/25 px-4 py-3 rounded-2xl shadow-[0_10px_30px_rgba(249,115,22,0.12)] text-xs text-slate-800 backdrop-blur-md">
          <p className="font-mono font-black text-slate-500 mb-2 uppercase tracking-widest">{label}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-6">
              <span className="text-orange-500 font-bold">Doanh thu:</span>
              <span className="font-mono font-black text-slate-900">{payload[0].value.toLocaleString()} VND</span>
            </div>
            {payload[1] && (
              <div className="flex justify-between items-center gap-6">
                <span className="text-purple-500 font-bold">Occupancy:</span>
                <span className="font-mono font-black text-slate-900">{payload[1].value}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl glass-premium glow-border-pulse p-6 shadow-2xl">
      {/* Background backing glow effect */}
      <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_65%)] pointer-events-none" />
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08),transparent_65%)] pointer-events-none" />
      
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 font-mono">Revenue & Occupancy Trend</h3>
      </div>

      <div className="h-[320px] w-full preserve-3d">
        {!data || data.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm font-semibold text-slate-400">No data to display</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="occGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(15,23,42,0.12)' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(15,23,42,0.12)' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(249,115,22,0.25)', strokeWidth: 1 }} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ color: '#475569', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace', textTransform: 'uppercase' }}
            />
            <Area 
              type="monotone" 
              name="Doanh thu (VND)"
              dataKey="revenue" 
              stroke="#f97316" 
              strokeWidth={2.5} 
              fill="url(#revGrad)" 
              activeDot={{ r: 5, strokeWidth: 0, fill: '#f97316' }}
            />
            <Area 
              type="monotone" 
              name="Occupancy (%)"
              dataKey="occupancy" 
              stroke="#a855f7" 
              strokeWidth={2} 
              fill="url(#occGrad)" 
              activeDot={{ r: 4, strokeWidth: 0, fill: '#a855f7' }}
            />
          </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
