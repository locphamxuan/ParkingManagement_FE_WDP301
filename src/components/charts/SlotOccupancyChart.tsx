import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export interface SlotOccupancySlice {
  name: string;
  value: number;
  color: string;
}

interface SlotOccupancyChartProps {
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  title?: string;
}

// Cùng bảng màu với legend trạng thái ô đỗ ở SlotMap3DView để nhất quán toàn hệ thống.
const STATUS_COLORS = {
  Available: '#10b981',
  Occupied: '#ef4444',
  Reserved: '#a855f7',
  Maintenance: '#f59e0b',
};

export function SlotOccupancyChart({ available, occupied, reserved, maintenance, title = 'Slot occupancy' }: SlotOccupancyChartProps) {
  const total = available + occupied + reserved + maintenance;
  const data: SlotOccupancySlice[] = [
    { name: 'Available', value: available, color: STATUS_COLORS.Available },
    { name: 'Occupied', value: occupied, color: STATUS_COLORS.Occupied },
    { name: 'Reserved', value: reserved, color: STATUS_COLORS.Reserved },
    { name: 'Maintenance', value: maintenance, color: STATUS_COLORS.Maintenance },
  ].filter((slice) => slice.value > 0);

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{title}</p>

      {total === 0 ? (
        <p className="py-6 text-center text-xs font-semibold text-slate-400">No slots configured yet.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="h-[120px] w-[120px] shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={38}
                  outerRadius={58}
                  paddingAngle={3}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={2}
                >
                  {data.map((slice) => (
                    <Cell key={slice.name} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0];
                      return (
                        <div className="bg-white/95 border border-blue-500/20 px-3 py-2 rounded-xl shadow-xl text-xs text-slate-800 backdrop-blur-md">
                          <p className="font-bold uppercase tracking-wider text-slate-400">{p.name}</p>
                          <p className="font-extrabold mt-0.5 text-xs" style={{ color: p.payload.color }}>{p.value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-slate-900">{total}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">slots</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            {data.map((slice) => (
              <div key={slice.name} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="text-slate-600">{slice.name}</span>
                </div>
                <span className="font-extrabold text-slate-800">{slice.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
