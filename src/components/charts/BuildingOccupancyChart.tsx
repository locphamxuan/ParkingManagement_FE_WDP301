import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface BuildingOccupancyPoint {
  id: string;
  name: string;
  occupancyRate: number;
  revenueToday: number;
}

const getBarColor = (rate: number) => {
  if (rate >= 75) return '#10b981';
  if (rate >= 40) return '#3b82f6';
  return '#f59e0b';
};

/** Horizontal bar chart comparing occupancy rate across buildings at a glance (admin overview). */
export function BuildingOccupancyChart({ buildings }: { buildings: BuildingOccupancyPoint[] }) {
  // Chỉ hiển thị top 8 để không tràn/rối biểu đồ; danh sách đầy đủ vẫn xem ở trang Buildings.
  const data = buildings.slice(0, 8).map((b) => ({
    ...b,
    shortName: b.name.length > 18 ? `${b.name.slice(0, 17)}…` : b.name,
  }));

  if (data.length === 0) {
    return <p className="text-xs text-slate-500 italic text-center py-6">No building data yet.</p>;
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="shortName"
            width={100}
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(59,130,246,0.06)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const p = payload[0].payload as BuildingOccupancyPoint;
                return (
                  <div className="bg-white/95 border border-blue-500/20 px-3 py-2 rounded-xl shadow-xl text-[10px] text-slate-800 backdrop-blur-md">
                    <p className="font-mono font-black uppercase tracking-wider text-slate-400">{p.name}</p>
                    <p className="font-black mt-1 font-mono text-xs">{p.occupancyRate}% occupied</p>
                    <p className="font-bold font-mono text-[10px] text-slate-500">{p.revenueToday.toLocaleString('vi-VN')} VND today</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="occupancyRate" radius={[0, 6, 6, 0]} barSize={14}>
            {data.map((entry) => (
              <Cell key={entry.id} fill={getBarColor(entry.occupancyRate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
