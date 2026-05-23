import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Gauge, ShieldAlert, Ticket, Clock3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { staffApi, extractShifts, type MyShift, type ParkingSession } from '@/services/staff/staffApi';
import { useBuildingContext } from '@/hooks/useBuildingContext';

const todayStr = () => new Date().toISOString().slice(0, 10);

export function StaffDashboardPage() {
  const { building } = useBuildingContext();
  const [dashboard, setDashboard] = useState<any>(null);
  const [shifts, setShifts] = useState<MyShift[]>([]);
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = todayStr();
    Promise.all([
      staffApi.getDashboard(),
      staffApi.getMyShifts({ from: d, to: d }),
      staffApi.getActiveSessions(),
    ])
      .then(([dashboardRes, shiftRes, sessionRes]) => {
        setDashboard((dashboardRes as any)?.data ?? dashboardRes);
        setShifts(extractShifts(shiftRes as any));
        setSessions(((sessionRes as any)?.data?.items ?? (sessionRes as any)?.data ?? []) as ParkingSession[]);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [building]);

  const stats = useMemo(
    () => [
      { label: 'Ca hôm nay', value: shifts.length, icon: CalendarClock, tint: 'from-orange-500/20 to-amber-500/10' },
      { label: 'Phiên đang mở', value: sessions.filter((s) => s.status === 'active').length, icon: Gauge, tint: 'from-amber-500/20 to-yellow-500/10' },
      { label: 'Đợi thanh toán', value: sessions.filter((s) => s.paymentStatus === 'pending').length, icon: Ticket, tint: 'from-slate-500/20 to-stone-500/10' },
      { label: 'Cảnh báo hôm nay', value: 3, icon: ShieldAlert, tint: 'from-rose-500/20 to-orange-500/10' },
    ],
    [sessions, shifts]
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950 to-orange-950/45 p-6 shadow-[0_22px_54px_rgba(15,23,42,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(249,115,22,0.14),transparent_20%),radial-gradient(circle_at_83%_12%,rgba(251,191,36,0.10),transparent_18%)]" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
              <Clock3 size={12} /> Bảng điều khiển Staff
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white">{building ? building.name : 'Khu vận hành chưa chọn'}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Nơi theo dõi ca trực, phiên gửi xe, cảnh báo vận hành và các trạng thái cần xử lý trong ngày.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="active" />
            <StatusBadge status="warning" />
            <StatusBadge status="pending" />
          </div>
        </div>
      </section>

      {dashboard ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <p className="font-semibold text-white">Dashboard staff từ API</p>
          <p className="mt-1 leading-6 text-slate-400">
            {dashboard.message || dashboard.title || 'Đã tải dữ liệu dashboard từ backend.'}
          </p>
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-white/10 bg-white/5">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.tint} p-3 text-white`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                  <p className="text-3xl font-semibold text-white">{loading ? '–' : String(card.value)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr,0.95fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Ca làm việc hôm nay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400">Đang tải...</p>
            ) : error ? (
              <p className="text-sm text-rose-300">{error}</p>
            ) : shifts.length === 0 ? (
              <p className="text-sm text-slate-400">Không có ca nào được phân công hôm nay.</p>
            ) : (
              shifts.map((s) => (
                <div key={s._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div>
                    <p className="font-semibold text-white">
                      {s.shift.code} — {s.shift.name}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-400">
                      {s.shift.startTime} – {s.shift.endTime} · {s.building.name}
                    </p>
                    {s.note ? <p className="mt-1 text-xs italic text-slate-500">{s.note}</p> : null}
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Phiên hiện tại & cảnh báo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400">Đang tải...</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có phiên gửi xe nào.</p>
            ) : (
              sessions.slice(0, 4).map((session) => (
                <div key={session._id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white">{session.plateNumber}</p>
                    <StatusBadge status={session.paymentStatus} />
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {session.gate?.name ?? 'Cổng chưa xác định'} · {session.vehicleType ? `${session.vehicleType.name} (${session.vehicleType.code})` : 'Loại xe chưa xác định'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Vào lúc {new Date(session.checkIn).toLocaleString('vi-VN')}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
}
