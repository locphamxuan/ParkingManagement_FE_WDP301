import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { MultiSlotForm, type SlotFormRow } from '@/components/manager/MultiSlotForm';
import { SlotMap3DView } from '@/components/manager/SlotMap3DView';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  type Floor,
  type ParkingSlot,
  type VehicleType,
  type Zone,
} from '@/services/manager/managerApi';

interface FormState {
  code: string;
  floor: string;
  zone: string;
  vehicleType: string;
  status: ParkingSlot['status'];
  reservable: boolean;
  note: string;
}

const empty: FormState = {
  code: '',
  floor: '',
  zone: '',
  vehicleType: '',
  status: 'available',
  reservable: true,
  note: '',
};

const SLOT_STATUSES: ParkingSlot['status'][] = ['available', 'occupied', 'reserved', 'maintenance'];

export function ManagerSlotsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<ParkingSlot[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [floorFilter, setFloorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ParkingSlot | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [multiSlotModalOpen, setMultiSlotModalOpen] = useState(false);

  // High-fidelity View mode toggle
  const [viewMode, setViewMode] = useState<'list' | '3d'>('3d');

  // Interactive cockpit rotation state values for 3D stacks
  const [rx, setRx] = useState(60);
  const [rz, setRz] = useState(-45);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, floorsRes, vtRes, zonesRes] = await Promise.all([
        managerApi.slots.list(buildingId, {
          floor: floorFilter || undefined,
          status: statusFilter || undefined,
        }),
        managerApi.floors.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
        managerApi.zones.list(buildingId),
      ]);
      setItems(slotsRes.data.items);
      setFloors(floorsRes.data.items);
      setVehicleTypes(vtRes.data.items);
      setZones(zonesRes.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [buildingId, floorFilter, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const floorMap = useMemo(() => {
    const map = new Map<string, Floor>();
    floors.forEach((f) => map.set(f._id, f));
    return map;
  }, [floors]);

  // Group slots by floor plate for vertical 3D rendering
  const slotsByFloor = useMemo(() => {
    const grouped: Record<string, ParkingSlot[]> = {};
    floors.forEach((f) => {
      grouped[f._id] = [];
    });
    items.forEach((item) => {
      const fId = typeof item.floor === 'string' ? item.floor : item.floor._id;
      if (grouped[fId]) {
        grouped[fId].push(item);
      } else {
        grouped[fId] = [item];
      }
    });
    return grouped;
  }, [items, floors]);

  const openCreate = () => {
    setForm(empty);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: ParkingSlot) => {
    const floorId = typeof row.floor === 'string' ? row.floor : row.floor._id;
    const vtId = !row.vehicleType
      ? ''
      : typeof row.vehicleType === 'string'
        ? row.vehicleType
        : row.vehicleType._id;
    const zoneId = !row.zone
      ? ''
      : typeof row.zone === 'string'
        ? row.zone
        : row.zone._id;
    setEditing(row);
    setForm({
      code: row.code,
      floor: floorId,
      zone: zoneId,
      vehicleType: vtId,
      status: row.status,
      reservable: row.reservable,
      note: row.note ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!form.floor) {
      alert('Select a floor first');
      return;
    }
    if (!form.zone) {
      alert('Select a zone first');
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      floor: form.floor,
      zone: form.zone,
      status: form.status,
      reservable: form.reservable,
      note: form.note.trim(),
    };
    try {
      if (editing) {
        await managerApi.slots.update(buildingId, editing._id, payload as Partial<ParkingSlot>);
      } else {
        await managerApi.slots.create(buildingId, payload as Partial<ParkingSlot> & { floor: string; zone: string });
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const onDelete = async (row: ParkingSlot) => {
    if (!window.confirm(`Delete slot ${row.code}?`)) return;
    try {
      await managerApi.slots.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const onMultiSlotSubmit = async (rows: SlotFormRow[]) => {
    for (const row of rows) {
      const payload = {
        code: row.code.trim().toUpperCase(),
        floor: row.floor,
        zone: row.zone,
        status: row.status,
        reservable: row.reservable,
        note: row.note.trim(),
      };
      await managerApi.slots.create(buildingId, payload as Partial<ParkingSlot> & { floor: string; zone: string });
    }
    refresh();
  };

  const onStatusChange = async (row: ParkingSlot, status: ParkingSlot['status']) => {
    try {
      await managerApi.slots.updateStatus(buildingId, row._id, status);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const columns: DataColumn<ParkingSlot>[] = [
    { key: 'code', title: 'Slot code' },
    {
      key: 'floor',
      title: 'Floor',
      render: (row) => {
        const id = typeof row.floor === 'string' ? row.floor : row.floor._id;
        const fl = floorMap.get(id);
        return fl ? fl.code : '?';
      },
    },
    {
      key: 'vehicleType',
      title: 'Vehicle type (by floor)',
      render: (row) => {
        const id = typeof row.floor === 'string' ? row.floor : row.floor._id;
        const fl = floorMap.get(id);
        const types = (fl?.allowedVehicleTypes ?? []) as Array<{ code?: string } | string>;
        if (!types.length) return 'Any type';
        return types.map((t) => (typeof t === 'object' ? t.code : t)).filter(Boolean).join(', ');
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => (
        <CustomSelect
          value={row.status}
          onChange={(val) => onStatusChange(row, val as ParkingSlot['status'])}
          options={SLOT_STATUSES.map((s) => ({
            value: s,
            label: s === 'available' ? 'Available' : s === 'occupied' ? 'Occupied' : s === 'reserved' ? 'Reserved' : 'Maintenance',
          }))}
          className="h-8 w-28 text-xs font-semibold"
        />
      ),
    },
    {
      key: 'reservable',
      title: 'Reservable',
      render: (row) => (row.reservable ? 'Yes' : 'No'),
    },
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
      
      {/* Sci-fi Controller & Toggle Row */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 glass-panel-dark p-4 rounded-3xl border border-white/5">
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            value={floorFilter}
            onChange={setFloorFilter}
            options={[
              { value: '', label: 'All floors' },
              ...floors.map((f) => ({
                value: f._id,
                label: f.code,
              })),
            ]}
            className="w-40"
          />
          
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All statuses' },
              ...SLOT_STATUSES.map((s) => ({
                value: s,
                label: s === 'available' ? 'Available (Green)' : s === 'occupied' ? 'Occupied (Orange)' : s === 'reserved' ? 'Reserved (Blue)' : 'Maintenance (Amber)',
              })),
            ]}
            className="w-48"
          />
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-xl bg-slate-950/80 border border-white/5 p-1 backdrop-blur-md">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'list' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Table view
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === '3d' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3D Hologram map
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={openCreate} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] gap-2">
            <Plus size={14} className="stroke-[3]" /> Add slot
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 flex items-center justify-center p-24 glass-panel-dark rounded-3xl border border-white/5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mr-2" />
          Loading slots...
        </div>
      ) : error ? (
        <div className="text-sm text-rose-400 glass-panel-dark p-6 rounded-3xl border border-rose-500/10 bg-rose-950/15">{error}</div>
      ) : (
        <div>
          {viewMode === 'list' ? (
            <div className="glass-panel-dark rounded-3xl border border-white/5 p-6 backdrop-blur-md shadow-2xl">
              <DataTable title={`Slots (${items.length})`} rows={items} columns={columns} />
            </div>
          ) : (
            /* Sci-Fi 3D Visual Map Mode */
            <SlotMap3DView
              floors={floors}
              floorFilter={floorFilter}
              slotsByFloor={slotsByFloor}
              rx={rx}
              rz={rz}
              setRx={setRx}
              setRz={setRz}
              statusFilter={statusFilter}
              vehicleTypes={vehicleTypes}
              items={items}
              onEditSlot={openEdit}
            />
          )}
        </div>
      )}

      {/* Standard modal form for adding/editing slots */}
      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit slot' : 'Add slot'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2 text-slate-100">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Slot code</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Floor</label>
            <CustomSelect
              value={form.floor}
              onChange={(val) => setForm((f) => ({ ...f, floor: val, zone: '' }))}
              options={[
                { value: '', label: 'Select floor' },
                ...floors.map((fl) => ({
                  value: fl._id,
                  label: fl.code,
                })),
              ]}
              placeholder="Select floor..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Zone</label>
            <CustomSelect
              value={form.zone}
              onChange={(val) => setForm((f) => ({ ...f, zone: val }))}
              options={[
                { value: '', label: 'Select zone' },
                ...zones
                  .filter((z) => (typeof z.floor === 'string' ? z.floor : z.floor._id) === form.floor)
                  .map((z) => ({
                    value: z._id,
                    label: z.code,
                  })),
              ]}
              placeholder="Select zone..."
              disabled={!form.floor}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <p className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-[11px] text-sky-300">
              The slot vehicle type is <strong>taken automatically from the floor allowed types</strong> (configured in the Floors tab); no need to set it here.
            </p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Status</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as ParkingSlot['status'] }))}
              options={SLOT_STATUSES.map((s) => ({
                value: s,
                label: s === 'available' ? 'Available' : s === 'occupied' ? 'Occupied' : s === 'reserved' ? 'Reserved' : 'Maintenance',
              }))}
            />
          </div>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-300 md:col-span-2 select-none">
            <input
              type="checkbox"
              checked={form.reservable}
              onChange={(e) => setForm((f) => ({ ...f, reservable: e.target.checked }))}
              className="w-4 h-4 rounded border-white/10 bg-slate-950 text-orange-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Allow advance reservation</span>
          </label>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Notes</label>
            <Input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
        </div>
      </ModalForm>

      {/* Multi-slot form for batch creation */}
      <MultiSlotForm
        isOpen={multiSlotModalOpen}
        onClose={() => setMultiSlotModalOpen(false)}
        onSubmit={onMultiSlotSubmit}
        floors={floors}
        zones={zones}
      />
    </div>
  );
}
