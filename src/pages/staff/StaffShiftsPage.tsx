import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Filter, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, extractShifts, type MyShift } from '@/services/staff/staffApi';

const demoShifts: MyShift[] = [
  {
    _id: 'demo-shift-1',
    shift: { _id: 's1', code: 'S1', name: 'Ca sáng', startTime: '07:00', endTime: '15:00' },
    building: { _id: 'demo-staff-building', name: 'Tòa nhà demo staff', code: 'PB-DEMO' },
    workDate: new Date().toISOString(),
    status: 'active',
    note: 'Dữ liệu demo khi staff chưa được gán building.',
  },
  {
    _id: 'demo-shift-2',
    shift: { _id: 's2', code: 'S2', name: 'Ca chiều', startTime: '15:00', endTime: '23:00' },
    building: { _id: 'demo-staff-building', name: 'Tòa nhà demo staff', code: 'PB-DEMO' },
    workDate: new Date().toISOString(),
    status: 'scheduled',
  },
];

export function StaffShiftsPage() {
  const { building } = useBuildingContext();
  const [items, setItems] = useState<MyShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const summary = useMemo(
    () => [
      { label: 'Tổng ca', value: items.length },
      { label: 'Đang làm', value: items.filter((i) => i.status === 'active').length },
      { label: 'Hoàn thành', value: items.filter((i) => i.status === 'completed').length },
      { label: 'Đã hủy', value: items.filter((i) => i.status === 'cancelled').length },
    ],
    [items]
  );

  const refresh = useCallback(() => {
    if (building?.preview) {
      setItems(demoShifts);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    staffApi
      .myShifts({ from: from || undefined, to: to || undefined })
      .then((res) => {
        setItems(extractShifts(res));
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns: DataColumn<MyShift>[] = [
    {
      key: 'workDate',
      title: 'Ngày',
      render: (row) => new Date(row.workDate).toLocaleDateString('vi-VN'),
    },
    {
      key: 'shift',
      title: 'Ca',
      render: (row) => `${row.shift.code} — ${row.shift.startTime}–${row.shift.endTime}`,
    },
    { key: 'building', title: 'Tòa nhà', render: (row) => row.building.name },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'note', title: 'Ghi chú', render: (row) => row.note ?? '—' },
  ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 md:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label} className="border-white/10 bg-white/5">
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {building?.preview ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-50">
          <p className="font-semibold text-white">Đang xem dữ liệu preview</p>
          <p className="mt-1 leading-6">Ca làm việc đang dùng dữ liệu mẫu để bạn nhìn thấy đầy đủ bố cục UI.</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-1.5">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Từ ngày</label>
          <input
            type="date"
            className="h-11 rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white outline-none"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Đến ngày</label>
          <input
            type="date"
            className="h-11 rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white outline-none"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {from || to ? (
            <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); }} className="gap-2 rounded-xl text-slate-300 hover:bg-white/6 hover:text-white">
              <RefreshCcw size={14} /> Reset
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={refresh} className="gap-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10">
            <Filter size={14} /> Lọc dữ liệu
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">Đang tải...</div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6 text-sm text-rose-200">{error}</div>
      ) : items.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6 text-sm text-slate-400">
            Không có ca nào trong khoảng thời gian này.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
            <CalendarClock size={12} /> Ca làm việc ({items.length})
          </div>
          <DataTable title={`Ca làm việc (${items.length})`} rows={items} columns={columns} />
        </div>
      )}
    </div>
  );
}
