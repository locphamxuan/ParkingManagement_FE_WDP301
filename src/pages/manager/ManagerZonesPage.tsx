import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
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

  // Vehicle types selectable for a zone are limited to the SELECTED FLOOR's
  // allowedVehicleTypes (manager-configured on the floor). If the floor lists none,
  // fall back to all of the building's vehicle types (floor unrestricted).
  const vtOptions = useMemo(() => {
    const floor = floorMap.get(form.floor);
    const allowed = (floor?.allowedVehicleTypes ?? []) as Array<VehicleType | string>;
    const allowedIds = allowed.map((t) => (typeof t === 'object' ? t._id : t));
    const list = allowedIds.length
      ? vehicleTypes.filter((v) => allowedIds.includes(v._id))
      : vehicleTypes;
    return list.map((v) => ({ value: v._id, label: `${v.code} — ${v.name}` }));
  }, [form.floor, floorMap, vehicleTypes]);

  // Remaining slot budget on the selected floor = floor.capacity − sum of OTHER zones'
  // capacity on that floor. Best-effort hint (the backend is the source of truth).
  const floorBudget = useMemo(() => {
    if (!form.floor) return null;
    const floorCap = Number(floorMap.get(form.floor)?.capacity ?? 0);
    if (floorCap <= 0) return null; // floor unlimited → no budget shown
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
    if (!window.confirm(`Delete zone ${row.code}? The zone must have no slots.`)) return;
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
        <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          {ZONE_USAGE_LABELS[r.usageType]}
        </span>
      ),
    },
    {
      key: 'capacity',
      title: 'Slots / Capacity',
      render: (r) => {
        const used = r.slotCount ?? 0;
        const cap = r.capacity ?? 0;
        const full = cap > 0 && used >= cap;
        return (
          <span className={full ? 'font-semibold text-amber-600' : ''}>
            {used}/{cap}{full ? ' (full)' : ''}
          </span>
        );
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <CustomSelect
          value={floorFilter}
          onChange={setFloorFilter}
          options={[{ value: '', label: 'All floors' }, ...floors.map((f) => ({ value: f._id, label: f.code }))]}
          className="w-44"
        />
        <Button onClick={openCreate} className="gap-2">
          <Plus size={14} />Add zone
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title={`Zones (${items.length})`} rows={items} columns={columns} />
      )}

      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit zone' : 'Add zone'} onSubmit={onSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Floor</label>
            <CustomSelect
              value={form.floor}
              onChange={(val) => setForm((f) => ({ ...f, floor: val, vehicleType: '' }))}
              options={[{ value: '', label: 'Select floor' }, ...floors.map((fl) => ({ value: fl._id, label: fl.code }))]}
              placeholder="Select floor..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Zone code</label>
            <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. A, B1" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Vehicle type</label>
            <CustomSelect
              value={form.vehicleType}
              onChange={(val) => setForm((f) => ({ ...f, vehicleType: val }))}
              options={[{ value: '', label: 'Select vehicle type' }, ...vtOptions]}
              placeholder="Select vehicle type..."
              disabled={!form.floor}
            />
            <p className="text-[11px] text-muted-foreground">
              {form.floor ? "Only vehicle types allowed on the selected floor." : 'Select a floor first.'}
            </p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Usage</label>
            <CustomSelect
              value={form.usageType}
              onChange={(val) => setForm((f) => ({ ...f, usageType: val as ZoneUsageType }))}
              options={USAGE_OPTIONS}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Name (optional)</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Capacity</label>
            <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
            {floorBudget && (
              <p className="text-[11px] text-muted-foreground">
                Floor budget: {floorBudget.used}/{floorBudget.floorCap} allocated · <strong>{floorBudget.remaining}</strong> remaining
              </p>
            )}
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs uppercase text-muted-foreground">Status</label>
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
