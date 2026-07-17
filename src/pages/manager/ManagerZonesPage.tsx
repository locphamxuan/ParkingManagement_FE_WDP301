import { useCallback, useEffect, useMemo, useState } from 'react';
import { showToast } from '@/components/common/ToastNotification';
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
  name: string;
  vehicleType: string;
  usageType: ZoneUsageType;
  capacity: string;
  status: Zone['status'];
}

const empty: FormState = {
  floor: '',
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
      setError(err instanceof Error ? err.message : 'Failed to load data');
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
      name: row.name ?? '',
      vehicleType: typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType._id,
      usageType: row.usageType,
      capacity: String(row.capacity ?? 0),
      status: row.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!form.floor) return showToast('Please select a floor', 'error');
    if (!form.name.trim()) return showToast('Please enter a zone name', 'error');
    if (!form.vehicleType) return showToast('Please select a vehicle type', 'error');
    // Mã zone do BE tự sinh từ name — chỉ gửi name.
    const body = {
      floor: form.floor,
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
      showToast('Zone saved successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  const onDelete = async (row: Zone) => {
    if (!window.confirm(`Delete zone ${row.code}? The zone must not contain any slots.`)) return;
    try {
      await managerApi.zones.remove(buildingId, row._id);
      refresh();
      showToast('Zone deleted successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  // Status Badge Component
  const ZoneStatusBadge = ({ status }: { status: Zone['status'] }) => {
    const config = {
      active: { bg: 'bg-emerald-50/80 border-emerald-200 text-emerald-700', label: 'Active', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' },
      inactive: { bg: 'bg-rose-50/80 border-rose-200 text-rose-700', label: 'Locked', dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' },
      maintenance: { bg: 'bg-amber-50/80 border-amber-200 text-amber-700', label: 'Maintenance', dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' },
    }[status] || { bg: 'bg-slate-50 border-slate-200 text-slate-700', label: 'Unknown', dot: 'bg-slate-500' };

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider font-mono ${config.bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  const columns: DataColumn<Zone>[] = [
    {
      key: 'code',
      title: 'Zone code',
      render: (r) => (
        <span className="font-mono text-sm font-black tracking-wider text-slate-800">{r.code}</span>
      ),
    },
    { key: 'name', title: 'Zone name', render: (r) => <span className="font-semibold text-slate-700">{r.name || '—'}</span> },
    {
      key: 'floor',
      title: 'Floor',
      render: (r) => {
        const id = typeof r.floor === 'string' ? r.floor : r.floor._id;
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-blue-600">
            <Layers size={12} className="stroke-[2.5]" />
            {floorMap.get(id)?.code ?? '?'}
          </span>
        );
      },
    },
    {
      key: 'vehicleType',
      title: 'Allowed vehicle types',
      render: (r) => {
        const id = typeof r.vehicleType === 'string' ? r.vehicleType : r.vehicleType._id;
        const vt = vtMap.get(id);
        return vt ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-150 text-blue-700 px-2.5 py-0.5 text-xs font-bold font-mono uppercase tracking-wider">
            {vt.name}
          </span>
        ) : '?';
      },
    },
    {
      key: 'usageType',
      title: 'Usage type',
      render: (r) => (
        <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider">
          {ZONE_USAGE_LABELS[r.usageType]}
        </span>
      ),
    },
    {
      key: 'capacity',
      title: 'Capacity / Used',
      render: (r) => {
        const used = r.slotCount ?? 0;
        const cap = r.capacity ?? 0;
        const percent = cap > 0 ? Math.min(100, (used / cap) * 100) : 0;
        return (
          <div className="flex flex-col gap-1.5 min-w-[120px]">
            <div className="flex justify-between text-xs font-bold font-mono">
              <span className={percent >= 100 ? 'text-amber-600' : 'text-slate-800'}>
                {used} / {cap} slots
              </span>
              <span className="text-slate-500 text-[10px]">{Math.round(percent)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 border border-slate-200/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  percent >= 100 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)]' : 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.2)]'
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
      title: 'Status',
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
            className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil size={14} className="stroke-[2.5]" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(row)}
            className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={14} className="stroke-[2.5]" />
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
              Facility Architecture
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <LayoutGrid size={22} className="text-blue-600 animate-pulse" />
              Zones & Areas
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Define specific zones, parking usage types, capacity rules, and vehicle permissions.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 w-fit self-end sm:self-auto shrink-0">
            <Plus size={14} className="stroke-[3]" /> Add zone
          </Button>
        </div>
      </div>

      {/* Modern Low-Profile Summary Row (API Data Powered) */}
      {!loading && !error && items.length > 0 && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Total Zones', val: `${stats.total} zones`, icon: LayoutGrid, color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { label: 'Active Zones', val: `${stats.active} active`, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { label: 'Max Capacity', val: `${stats.totalCapacity} slots`, icon: ShieldCheck, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
            { label: 'Configured Slots', val: `${stats.totalUsed} / ${stats.totalCapacity}`, icon: Layers, color: 'text-purple-600 bg-purple-50 border-purple-200' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="rounded-2xl border-2 border-blue-100 bg-white p-4 shadow-sm hover:translate-y-[-2px] hover:border-blue-400 hover:shadow-md transition-all duration-200 flex items-center justify-between group select-none">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">{stat.label}</p>
                  <p className="mt-1 text-lg font-black text-indigo-950 font-mono group-hover:text-blue-700 transition-colors">{stat.val}</p>
                </div>
                <div className={`p-2 rounded-xl border-2 shrink-0 ${stat.color} group-hover:scale-105 transition-transform duration-250`}>
                  <Icon size={16} className="stroke-[2.5]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Table */}
      <div className="glass-panel-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400 font-medium flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-sky-500/20 border-t-sky-500 animate-spin" />
            Loading zones...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400 font-medium flex items-center justify-center gap-2">
            <XCircle size={16} />
            {error}
          </div>
        ) : (
          <DataTable
            title={`Zones (${items.length})`}
            rows={items}
            columns={columns}
            rightElement={
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Floor:</span>
                <CustomSelect
                  value={floorFilter}
                  onChange={setFloorFilter}
                  options={[{ value: '', label: 'All floors' }, ...floors.map((f) => ({ value: f._id, label: f.name ? `${f.code} — ${f.name}` : `Floor ${f.code}` }))]}
                  className="w-40 bg-white border-blue-150 text-slate-800 rounded-xl h-9 text-xs"
                  placeholder="Filter by floor..."
                />
              </div>
            }
          />
        )}
      </div>

      {/* Modal Form */}
      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Configure zone' : 'Create new zone'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2 text-slate-800">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Floor *</label>
            <CustomSelect
              value={form.floor}
              onChange={(val) => setForm((f) => ({ ...f, floor: val, vehicleType: '' }))}
              options={[{ value: '', label: 'Select floor' }, ...floors.map((fl) => ({ value: fl._id, label: fl.name ? `${fl.code} — ${fl.name}` : `Floor ${fl.code}` }))]}
              placeholder="Select floor..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Zone name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Walk-in zone, VIP zone A"
              className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
            />
            <p className="text-[10px] text-slate-500 font-medium">
              {editing
                ? `Zone code: ${editing.code} (auto-generated, cannot be changed)`
                : 'The zone code is auto-generated from the name.'}
            </p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Vehicle type *</label>
            <CustomSelect
              value={form.vehicleType}
              onChange={(val) => setForm((f) => ({ ...f, vehicleType: val }))}
              options={[{ value: '', label: 'Select vehicle type' }, ...vtOptions]}
              placeholder="Select vehicle type..."
              disabled={!form.floor}
            />
            <p className="text-[10px] text-slate-500 font-medium">
              {form.floor ? 'Only vehicle types declared for the selected floor.' : 'Please select a floor first.'}
            </p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Usage type *</label>
            <CustomSelect
              value={form.usageType}
              onChange={(val) => setForm((f) => ({ ...f, usageType: val as ZoneUsageType }))}
              options={USAGE_OPTIONS}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Zone capacity (slots) *</label>
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
            />
            {floorBudget && (
              <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-500" />
                Floor budget: {floorBudget.used}/{floorBudget.floorCap} slots allocated. Remaining: <strong>{floorBudget.remaining} slots</strong>.
              </p>
            )}
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Zone status</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as Zone['status'] }))}
              options={ZONE_STATUSES.map((s) => ({
                value: s,
                label: s === 'active' ? 'Active' : s === 'inactive' ? 'Temporarily locked' : 'Maintenance',
              }))}
            />
          </div>
        </div>
      </ModalForm>
    </div>
  );
}
