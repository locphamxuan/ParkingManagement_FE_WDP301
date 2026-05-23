import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3, Filter, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';

const demoSessions: ParkingSession[] = [
  {
    _id: 'demo-session-1',
    plateNumber: '59A-123.45',
    vehicleType: { _id: 'vt1', name: 'Ô tô', code: 'CAR' },
    gate: { _id: 'g1', code: 'IN', name: 'Cổng vào A' },
    checkIn: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    paymentStatus: 'pending',
    status: 'active',
  },
  {
    _id: 'demo-session-2',
    plateNumber: '29B1-678.90',
    vehicleType: { _id: 'vt2', name: 'Xe máy', code: 'MOTO' },
    gate: { _id: 'g2', code: 'OUT', name: 'Cổng ra B' },
    checkIn: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    checkOut: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    duration: 160,
    fee: 12000,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    status: 'completed',
  },
];

const fmt = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} đ` : '—';

const fmtTime = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString('vi-VN') : '—';

export function StaffSessionsPage() {
  const { buildingId, building } = useBuildingContext();
  const [items, setItems] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');

  const refresh = useCallback(() => {
    if (building?.preview) {
      setItems(demoSessions);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    staffApi.sessions
      .list(buildingId, { status: statusFilter || undefined })
      .then((res) => {
        setItems(res.data.items);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [buildingId, statusFilter]);

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesQuery = `${item.plateNumber} ${item.gate?.name ?? ''} ${item.vehicleType?.name ?? ''}`
          .toLowerCase()
          .includes(query.toLowerCase());
        return matchesQuery;
      }),
    [items, query]
  );

  const summary = useMemo(
    () => [
      { label: 'Đang hoạt động', value: items.filter((i) => i.status === 'active').length },
      { label: 'Đã thanh toán', value: items.filter((i) => i.paymentStatus === 'paid').length },
      { label: 'Chờ thanh toán', value: items.filter((i) => i.paymentStatus === 'pending').length },
    ],
    [items]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns: DataColumn<ParkingSession>[] = [
    { key: 'plateNumber', title: 'Biển số' },
    {
      key: 'vehicleType',
      title: 'Loại xe',
      render: (row) =>
        row.vehicleType ? `${row.vehicleType.name} (${row.vehicleType.code})` : '—',
    },
    { key: 'gate', title: 'Cổng', render: (row) => row.gate?.name ?? '—' },
    { key: 'checkIn', title: 'Vào', render: (row) => fmtTime(row.checkIn) },
    { key: 'checkOut', title: 'Ra', render: (row) => fmtTime(row.checkOut) },
    { key: 'fee', title: 'Phí', render: (row) => fmt(row.fee) },
    {
      key: 'paymentMethod',
      title: 'Phương thức',
      render: (row) => row.paymentMethod?.toUpperCase() ?? '—',
    },
    {
      key: 'paymentStatus',
      title: 'Thanh toán',
      render: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/40 p-6 shadow-[0_22px_54px_rgba(15,23,42,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.14),transparent_22%),radial-gradient(circle_at_82%_14%,rgba(34,211,238,0.10),transparent_18%)]" />
        <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
              <Clock3 size={12} /> Phiên gửi xe
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white">{building ? building.name : 'Danh sách phiên gửi xe'}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Theo dõi lịch sử vào/ra, phương thức thanh toán, cổng xử lý và trạng thái từng session tại tòa nhà đang chọn.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="active" />
            <StatusBadge status="pending" />
            <StatusBadge status="paid" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {summary.map((card) => (
          <Card key={card.label} className="border-white/10 bg-white/5">
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {building?.preview ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-50">
          <p className="font-semibold text-white">Đang xem dữ liệu preview</p>
          <p className="mt-1 leading-6">Đây là dữ liệu mẫu vì staff hiện chưa có building được gán từ BE.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo biển số, cổng, loại xe..."
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/50 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
        <select
          className="h-11 rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">Đang tải...</div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">{error}</div>
      ) : visibleItems.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6 text-sm text-slate-400">
            Không có phiên gửi xe nào.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
            <Filter size={12} /> Phiên gửi xe ({visibleItems.length})
          </div>
          <DataTable title={`Phiên gửi xe (${visibleItems.length})`} rows={visibleItems} columns={columns} />
        </div>
      )}
    </div>
  );
}
