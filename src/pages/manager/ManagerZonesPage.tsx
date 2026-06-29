import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
  capacity: '0',
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
      setError(err instanceof Error ? err.message : 'Failed to load');
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

  // Manager may freely assign ANY vehicle type created for the building (not floor-locked).
  const vtOptions = useMemo(
    () => vehicleTypes.map((v) => ({ value: v._id, label: `${v.code} — ${v.name}` })),
    [vehicleTypes]
  );

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
    if (!form.floor) return alert('Please select a floor');
    if (!form.vehicleType) return alert('Please select a vehicle type');
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
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const onDelete = async (row: Zone) => {
    if (!window.confirm(`Delete zone ${row.code}?`)) return;
    try {
      await managerApi.zones.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const columns: DataColumn<Zone>[] = [
    { key: 'code', title: 'Zone code' },
    { key: 'name', title: 'Name', render: (r) => r.name || '—' },
    {
      key: 'floor',
      title: 'Floor',
      render: (r) => {
        const id = typeof r.floor === 'string' ? r.floor : r.floor._id;
        return floorMap.get(id)?.code ?? '?';
      },
    },
    {
      key: 'vehicleType',
      title: 'Vehicle type',
      render: (r) => {
        const id = typeof r.vehicleType === 'string' ? r.vehicleType : r.vehicleType._id;
        const vt = vtMap.get(id);
        return vt ? `${vt.code} — ${vt.name}` : '?';
      },
    },
    {
      key: 'usageType',
      title: 'Usage',
      render: (r) => (
        <span className="inline-block rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-300 px-2 py-0.5 text-[11px] font-bold">
          {ZONE_USAGE_LABELS[r.usageType]}
        </span>
      ),
    },
    { key: 'capacity', title: 'Capacity', render: (r) => r.capacity ?? 0 },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)} className="hover:bg-orange-500/10 hover:text-orange-400">
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)} className="hover:bg-rose-500/10 hover:text-rose-400">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel-dark p-4 rounded-3xl border border-white/5">
        <CustomSelect
          value={floorFilter}
          onChange={setFloorFilter}
          options={[{ value: '', label: 'All floors' }, ...floors.map((f) => ({ value: f._id, label: f.code }))]}
          className="w-40"
        />
        <Button onClick={openCreate} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider gap-2">
          <Plus size={14} className="stroke-[3]" />Add zone
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 flex items-center justify-center p-24 glass-panel-dark rounded-3xl border border-white/5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mr-2" />Loading zones...
        </div>
      ) : error ? (
        <div className="text-sm text-rose-400 glass-panel-dark p-6 rounded-3xl border border-rose-500/10 bg-rose-950/15">{error}</div>
      ) : (
        <div className="glass-panel-dark rounded-3xl border border-white/5 p-6 backdrop-blur-md shadow-2xl">
          <DataTable title={`Zones (${items.length})`} rows={items} columns={columns} />
        </div>
      )}

      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit zone' : 'Add zone'} onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2 text-slate-100">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Floor</label>
            <CustomSelect
              value={form.floor}
              onChange={(val) => setForm((f) => ({ ...f, floor: val, vehicleType: '' }))}
              options={[{ value: '', label: 'Select floor' }, ...floors.map((fl) => ({ value: fl._id, label: fl.code }))]}
              placeholder="Select floor..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Zone code</label>
            <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. A, B1" className="bg-slate-950 border-white/10 text-white rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Vehicle type</label>
            <CustomSelect
              value={form.vehicleType}
              onChange={(val) => setForm((f) => ({ ...f, vehicleType: val }))}
              options={[{ value: '', label: 'Select vehicle type' }, ...vtOptions]}
              placeholder="Select vehicle type..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Usage</label>
            <CustomSelect
              value={form.usageType}
              onChange={(val) => setForm((f) => ({ ...f, usageType: val as ZoneUsageType }))}
              options={USAGE_OPTIONS}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Name (optional)</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-slate-950 border-white/10 text-white rounded-xl" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Capacity</label>
            <Input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} className="bg-slate-950 border-white/10 text-white rounded-xl" />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Status</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as Zone['status'] }))}
              options={ZONE_STATUSES.map((s) => ({ value: s, label: s === 'active' ? 'Active' : s === 'inactive' ? 'Inactive' : 'Maintenance' }))}
            />
          </div>
        </div>
      </ModalForm>
    </div>
  );
}
