import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, LayoutGrid, Layers, ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  ZONE_USAGE_LABELS,
  type Floor,
  type VehicleType,
  type Zone,
  type ZoneUsageType,
} from '@/services/manager/managerApi';

interface FormState {
  floor: string;
  code: string;
  name: string;
  vehicleType: string;
  usageType: ZoneUsageType;
  capacity: string;
  status: Zone['status'];
}

const empty: FormState = {
  floor: '',
  code: '',
  name: '',
  vehicleType: '',
  usageType: 'walk_in',
  capacity: '1',
  status: 'active',
};

const USAGE_OPTIONS = (Object.keys(ZONE_USAGE_LABELS) as ZoneUsageType[]).map((u) => ({
  value: u,
  label: ZONE_USAGE_LABELS[u],
}));

const ZONE_STATUSES: Zone['status'][] = ['active', 'inactive', 'maintenance'];

export function ManagerZonesPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Zone[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [floorFilter, setFloorFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [zonesRes, floorsRes, vtRes] = await Promise.all([
        managerApi.zones.list(buildingId, { floor: floorFilter || undefined }),
        managerApi.floors.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      setItems(zonesRes.data.items);
      setFloors(floorsRes.data.items);
      setVehicleTypes(vtRes.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải dữ liệu thất bại');
    } finally {
      setLoading(false);
    }
  }, [buildingId, floorFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const floorMap = useMemo(() => {
    const map = new Map<string, Floor>();
    floors.forEach((f) => map.set(f._id, f));
    return map;
  }, [floors]);

  const vtMap = useMemo(() => {
    const map = new Map<string, VehicleType>();
    vehicleTypes.forEach((v) => map.set(v._id, v));
    return map;
  }, [vehicleTypes]);

  const vtOptions = useMemo(() => {
    const floor = floorMap.get(form.floor);
    const allowed = (floor?.allowedVehicleTypes ?? []) as Array<VehicleType | string>;
    const allowedIds = allowed.map((t) => (typeof t === 'object' ? t._id : t));
    const list = allowedIds.length
      ? vehicleTypes.filter((v) => allowedIds.includes(v._id))
      : vehicleTypes;
    return list.map((v) => ({ value: v._id, label: `${v.code} — ${v.name}` }));
  }, [form.floor, floorMap, vehicleTypes]);

  const floorBudget = useMemo(() => {
    if (!form.floor) return null;
    const floorCap = Number(floorMap.get(form.floor)?.capacity ?? 0);
    if (floorCap <= 0) return null;
    const used = items
      .filter(
        (z) =>
          (typeof z.floor === 'string' ? z.floor : z.floor._id) === form.floor &&
          z._id !== editing?._id
      )
      .reduce((sum, z) => sum + Number(z.capacity || 0), 0);
    return { floorCap, used, remaining: Math.max(0, floorCap - used) };
  }, [form.floor, floorMap, items, editing]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (row: Zone) => {
    setEditing(row);
    setForm({
      floor: typeof row.floor === 'string' ? row.floor : row.floor._id,
      code: row.code,
      name: row.name ?? '',
      vehicleType: typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType._id,
      usageType: row.usageType,
      capacity: String(row.capacity ?? 0),
      status: row.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!form.floor) return alert('Vui lòng chọn tầng');
    if (!form.vehicleType) return alert('Vui lòng chọn loại xe');
    const body = {
      floor: form.floor,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      vehicleType: form.vehicleType,
      usageType: form.usageType,
      capacity: Number(form.capacity) || 0,
      status: form.status,
    };
    try {
      if (editing) {
        await managerApi.zones.update(buildingId, editing._id, body);
      } else {
        await managerApi.zones.create(buildingId, body);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const onDelete = async (row: Zone) => {
    if (!window.confirm(`Xóa dãy ${row.code}? Dãy này phải không chứa ô đỗ nào.`)) return;
    try {
      await managerApi.zones.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  // Status Badge Component
  const ZoneStatusBadge = ({ status }: { status: Zone['status'] }) => {
    const config = {
      active: { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', label: 'Hoạt động', dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' },
      inactive: { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', label: 'Tạm khóa', dot: 'bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]' },
      maintenance: { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', label: 'Bảo trì', dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' },
    }[status] || { bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400', label: 'Không rõ', dot: 'bg-slate-400' };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider font-mono ${config.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  const columns: DataColumn<Zone>[] = [
    {
      key: 'code',
      title: 'Mã dãy',
      render: (r) => (
        <span className="font-mono text-sm font-black tracking-wider text-slate-100">{r.code}</span>
      ),
    },
    { key: 'name', title: 'Tên dãy', render: (r) => <span className="font-semibold text-slate-200">{r.name || '—'}</span> },
    {
      key: 'floor',
      title: 'Tầng',
      render: (r) => {
        const id = typeof r.floor === 'string' ? r.floor : r.floor._id;
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-sky-400">
            <Layers size={12} />
            {floorMap.get(id)?.code ?? '?'}
          </span>
        );
      },
    },
    {
      key: 'vehicleType',
      title: 'Loại xe cho phép',
      render: (r) => {
        const id = typeof r.vehicleType === 'string' ? r.vehicleType : r.vehicleType._id;
        const vt = vtMap.get(id);
        return vt ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-white/5 px-2.5 py-1 text-xs font-bold text-slate-300">
            {vt.name}
          </span>
        ) : '?';
      },
    },
    {
      key: 'usageType',
      title: 'Đối tượng sử dụng',
      render: (r) => (
        <span className="inline-flex items-center gap-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 px-2.5 py-1 rounded-xl text-xs font-bold">
          {ZONE_USAGE_LABELS[r.usageType]}
        </span>
      ),
    },
    {
      key: 'capacity',
      title: 'Sức chứa / Đã dùng',
      render: (r) => {
        const used = r.slotCount ?? 0;
        const cap = r.capacity ?? 0;
        const percent = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
        return (
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <div className="flex justify-between text-xs font-bold font-mono">
              <span className={percent >= 100 ? 'text-amber-400' : 'text-slate-300'}>
                {used} / {cap} ô
              </span>
              <span className="text-slate-400 text-[10px]">{Math.round(percent)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-900 border border-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percent >= 100 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (r) => <ZoneStatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex gap-1 justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEdit(row)}
            className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(row)}
            className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  // Quick stats
  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter(z => z.status === 'active').length;
    const totalCapacity = items.reduce((sum, z) => sum + (z.capacity ?? 0), 0);
    const totalUsed = items.reduce((sum, z) => sum + (z.slotCount ?? 0), 0);
    return { total, active, totalCapacity, totalUsed };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel-dark border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
            <LayoutGrid size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Tổng số dãy</p>
            <p className="text-2xl font-black text-slate-100 mt-0.5 font-mono">{stats.total}</p>
          </div>
        </div>

        <div className="glass-panel-dark border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Dãy hoạt động</p>
            <p className="text-2xl font-black text-slate-100 mt-0.5 font-mono">{stats.active}</p>
          </div>
        </div>

        <div className="glass-panel-dark border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Tổng ô đỗ tối đa</p>
            <p className="text-2xl font-black text-slate-100 mt-0.5 font-mono">{stats.totalCapacity}</p>
          </div>
        </div>

        <div className="glass-panel-dark border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Ô đỗ đã thiết lập</p>
            <p className="text-2xl font-black text-slate-100 mt-0.5 font-mono">
              {stats.totalUsed} <span className="text-xs font-bold text-slate-400">/ {stats.totalCapacity}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="glass-panel-dark border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono hidden sm:inline">Lọc:</span>
          <CustomSelect
            value={floorFilter}
            onChange={setFloorFilter}
            options={[{ value: '', label: 'Tất cả các tầng' }, ...floors.map((f) => ({ value: f._id, label: `Tầng ${f.code}` }))]}
            className="w-48 bg-slate-950/40 border-white/10 text-white rounded-xl"
            placeholder="Lọc theo tầng..."
          />
        </div>

        <Button
          onClick={openCreate}
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={16} />
          Thêm dãy mới
        </Button>
      </div>

      {/* Main Table */}
      <div className="glass-panel-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400 font-medium flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
            Đang tải danh sách dãy...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400 font-medium flex items-center justify-center gap-2">
            <XCircle size={16} />
            {error}
          </div>
        ) : (
          <DataTable title={`Danh sách dãy đỗ (${items.length})`} rows={items} columns={columns} />
        )}
      </div>

      {/* Modal Form */}
      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Cấu hình dãy đỗ' : 'Tạo dãy đỗ mới'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2 text-slate-100">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Tầng *</label>
            <CustomSelect
              value={form.floor}
              onChange={(val) => setForm((f) => ({ ...f, floor: val, vehicleType: '' }))}
              options={[{ value: '', label: 'Chọn tầng đỗ' }, ...floors.map((fl) => ({ value: fl._id, label: `Tầng ${fl.code}` }))]}
              placeholder="Chọn tầng..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Mã dãy *</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="Ví dụ: A, B, C1"
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-sky-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Loại xe *</label>
            <CustomSelect
              value={form.vehicleType}
              onChange={(val) => setForm((f) => ({ ...f, vehicleType: val }))}
              options={[{ value: '', label: 'Chọn loại xe đỗ' }, ...vtOptions]}
              placeholder="Chọn loại xe..."
              disabled={!form.floor}
            />
            <p className="text-[10px] text-slate-400 font-medium">
              {form.floor ? 'Chỉ gồm các loại xe được khai báo ở tầng đã chọn.' : 'Vui lòng chọn tầng trước.'}
            </p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Đối tượng sử dụng *</label>
            <CustomSelect
              value={form.usageType}
              onChange={(val) => setForm((f) => ({ ...f, usageType: val as ZoneUsageType }))}
              options={USAGE_OPTIONS}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Tên dãy (Tùy chọn)</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ví dụ: Dãy xe máy tầng 1"
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-sky-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Sức chứa dãy (ô đỗ) *</label>
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-sky-500/40"
            />
            {floorBudget && (
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-400" />
                Ngân sách tầng: Đã chia {floorBudget.used}/{floorBudget.floorCap} ô. Còn lại: <strong>{floorBudget.remaining} ô</strong>.
              </p>
            )}
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Trạng thái dãy</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as Zone['status'] }))}
              options={ZONE_STATUSES.map((s) => ({
                value: s,
                label: s === 'active' ? 'Hoạt động' : s === 'inactive' ? 'Khóa tạm thời' : 'Bảo trì',
              }))}
            />
          </div>
        </div>
      </ModalForm>
    </div>
  );
}
