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
        <div className="bg-white/95 border border-blue-500/20 px-4 py-3 rounded-2xl shadow-[0_12px_36px_rgba(31,38,135,0.06)] text-xs text-slate-800 backdrop-blur-md">
          <p className="font-mono font-black text-slate-400 mb-2 uppercase tracking-widest">{label}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-6">
              <span className="text-blue-600 font-bold">Doanh thu:</span>
              <span className="font-mono font-black text-slate-900">{payload[0].value.toLocaleString()} VND</span>
            </div>
            {payload[1] && (
              <div className="flex justify-between items-center gap-6">
                <span className="text-sky-500 font-bold">Occupancy:</span>
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
    <div className="relative overflow-hidden rounded-3xl glass-premium p-6 shadow-lg border border-sky-100/80 transition-all duration-500 hover:shadow-[0_22px_45px_rgba(37,99,235,0.08)] hover:-translate-y-1 hover:border-blue-500/30 group">
      {/* Crystal Bevel Border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />
      
      {/* Background backing glow effect */}
      <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.1),transparent_65%)] pointer-events-none blur-2xl" />
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_65%)] pointer-events-none blur-2xl" />
      
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
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="occGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
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
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(245,158,11,0.2)', strokeWidth: 1 }} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ color: '#475569', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace', textTransform: 'uppercase' }}
            />
            <Area 
              type="monotone" 
              name="Doanh thu (VND)"
              dataKey="revenue" 
              stroke="#f59e0b" 
              strokeWidth={2.5} 
              fill="url(#revGrad)" 
              activeDot={{ r: 5, strokeWidth: 0, fill: '#f59e0b' }}
            />
            <Area 
              type="monotone" 
              name="Occupancy (%)"
              dataKey="occupancy" 
              stroke="#10b981" 
              strokeWidth={2} 
              fill="url(#occGrad)" 
              activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
            />
          </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
