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
    <div className="rounded-2xl border-2 border-blue-100 bg-slate-50/50 p-4">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-550 font-mono mb-2">{title}</p>

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
                        <div className="bg-white/95 border border-blue-500/20 px-3 py-2 rounded-xl shadow-xl text-[10px] text-slate-800 backdrop-blur-md">
                          <p className="font-mono font-black uppercase tracking-wider text-slate-400">{p.name}</p>
                          <p className="font-black mt-1 font-mono text-xs" style={{ color: p.payload.color }}>{p.value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-black text-slate-900 font-mono">{total}</span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide">slots</span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            {data.map((slice) => (
              <div key={slice.name} className="flex items-center justify-between text-[10px] font-bold font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="text-slate-600">{slice.name}</span>
                </div>
                <span className="text-slate-800">{slice.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
