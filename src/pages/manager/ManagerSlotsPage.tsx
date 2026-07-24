import { useCallback, useEffect, useMemo, useState } from 'react';
import { showToast } from '@/components/common/ToastNotification';
import { Pencil, Plus, Trash2, LayoutGrid, CheckCircle2, Car, ShieldCheck, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { ModalForm } from '@/components/modals/ModalForm';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { CustomSelect } from '@/components/ui/select';
import { MultiSlotForm, type SlotBatchInput } from '@/components/manager/MultiSlotForm';
import { SlotMap3DView } from '@/components/manager/SlotMap3DView';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  type Floor,
  type ParkingSlot,
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
  const [floorFilter, setFloorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ParkingSlot | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [multiSlotModalOpen, setMultiSlotModalOpen] = useState(false);
  const [batchQty, setBatchQty] = useState(5);

  const openBatchModal = (qty = 5) => {
    setBatchQty(qty);
    setMultiSlotModalOpen(true);
  };

  // High-fidelity View mode toggle
  const [viewMode, setViewMode] = useState<'list' | '3d'>('3d');

  // Interactive cockpit rotation state values for 3D stacks
  const [rx, setRx] = useState(60);
  const [rz, setRz] = useState(-45);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, floorsRes, zonesRes] = await Promise.all([
        managerApi.slots.list(buildingId, {
          floor: floorFilter || undefined,
          status: statusFilter || undefined,
        }),
        managerApi.floors.list(buildingId),
        managerApi.zones.list(buildingId),
      ]);
      setItems(slotsRes.data.items);
      setFloors(floorsRes.data.items);
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
      showToast('Select a floor first', 'error');
      return;
    }
    if (!form.zone) {
      showToast('Select a zone first', 'error');
      return;
    }
    const payload: Record<string, unknown> = {
      floor: form.floor,
      zone: form.zone,
      status: form.status,
      reservable: form.reservable,
      note: form.note.trim(),
    };
    // code chỉ gửi khi tạo và người dùng nhập; bỏ trống → BE tự sinh. Update: BE không cho đổi code.
    if (!editing && form.code.trim()) payload.code = form.code.trim().toUpperCase();
    try {
      if (editing) {
        await managerApi.slots.update(buildingId, editing._id, payload as any);
      } else {
        await managerApi.slots.create(buildingId, payload as any);
      }
      setModalOpen(false);
      refresh();
      showToast('Slot saved successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  // Xác nhận qua ConfirmModal (bỏ window.confirm native).
  const [deleteTarget, setDeleteTarget] = useState<ParkingSlot | null>(null);
  const [deleting, setDeleting] = useState(false);
  const onDelete = (row: ParkingSlot) => setDeleteTarget(row);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await managerApi.slots.remove(buildingId, deleteTarget._id);
      refresh();
      showToast('Slot deleted successfully', 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Tạo hàng loạt qua POST /slots/batch — BE tự sinh mã nối tiếp theo code zone.
  const onMultiSlotSubmit = async (input: SlotBatchInput) => {
    try {
      await managerApi.slots.createBatch(buildingId, input);
      refresh();
      showToast('Batch slots created successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Batch creation failed', 'error');
    }
  };

  const onStatusChange = async (row: ParkingSlot, status: ParkingSlot['status']) => {
    try {
      await managerApi.slots.updateStatus(buildingId, row._id, status);
      refresh();
      showToast('Slot status updated', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
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

  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter((x) => x.status === 'available').length;
    const occupied = items.filter((x) => x.status === 'occupied').length;
    const reservable = items.filter((x) => x.reservable).length;
    return { total, available, occupied, reservable };
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
              Facility Slots
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Square size={20} className="text-blue-600 animate-pulse fill-blue-600/10 stroke-[2.5]" />
              Parking Slots & Holograms
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Monitor, structure, and configure real-time slot states, availability, and batch assignments.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              variant="outline"
              onClick={() => setMultiSlotModalOpen(true)}
              className="h-11 px-5 rounded-xl border-2 border-blue-200 hover:border-blue-300 text-blue-700 font-black text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.98]"
            >
              <Plus size={14} className="stroke-[3] mr-1.5" /> Add batch
            </Button>
            <Button
              onClick={openCreate}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Plus size={14} className="stroke-[3] mr-1.5" /> Add slot
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Low-Profile Summary Row (API Data Powered) */}
      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Total Slots', val: `${stats.total} slots`, icon: LayoutGrid, color: 'text-blue-600 bg-blue-50 border-blue-200', border: 'border-l-blue-500', glow: 'hover:shadow-blue-500/10 hover:border-blue-300' },
            { label: 'Available', val: `${stats.available} free`, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', border: 'border-l-emerald-500', glow: 'hover:shadow-emerald-500/10 hover:border-emerald-300' },
            { label: 'Occupied', val: `${stats.occupied} busy`, icon: Car, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', border: 'border-l-indigo-500', glow: 'hover:shadow-indigo-500/10 hover:border-indigo-300' },
            { label: 'Reservable', val: `${stats.reservable} bookable`, icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 border-purple-200', border: 'border-l-purple-500', glow: 'hover:shadow-purple-500/10 hover:border-purple-300' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`rounded-2xl border-2 border-l-4 border-slate-100 ${stat.border} bg-white p-4 shadow-sm hover:translate-y-[-2px] ${stat.glow} transition-all duration-200 flex items-center justify-between group select-none`}>
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

      {/* Controller / Filtering Row */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            value={floorFilter}
            onChange={setFloorFilter}
            options={[
              { value: '', label: 'All floors' },
              ...floors.map((f) => ({
                value: f._id,
                label: f.name ? `${f.code} — ${f.name}` : f.code,
              })),
            ]}
            className="w-40 bg-white border-blue-100 text-slate-800 rounded-xl"
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
            className="w-48 bg-white border-blue-100 text-slate-800 rounded-xl"
          />
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-xl bg-slate-100 border border-slate-200 p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                : 'text-slate-500 hover:text-slate-855'
            }`}
          >
            Table view
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
              viewMode === '3d' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                : 'text-slate-500 hover:text-slate-855'
            }`}
          >
            3D Hologram map
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-650 text-xs font-bold p-8 justify-center bg-white rounded-2xl border-2 border-blue-100 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
          <span>Loading slot configurations...</span>
        </div>
      ) : error ? (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{error}</p>
      ) : (
        <div>
          {viewMode === 'list' ? (
            <div className="bg-white rounded-2xl border-2 border-blue-105 p-6 shadow-sm">
              <DataTable title={`Slots (${items.length})`} rows={items} columns={columns} />
            </div>
          ) : (
            /* Sci-Fi 3D Visual Map Mode */
            <SlotMap3DView
              floorFilter={floorFilter}
              slotsByFloor={slotsByFloor}
              rx={rx}
              rz={rz}
              setRx={setRx}
              setRz={setRz}
              items={items}
              onEditSlot={openEdit}
              onOpenMultiSlot={openBatchModal}
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
        <div className="grid gap-4 md:grid-cols-2 text-slate-800">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Slot code</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder={editing ? undefined : 'Leave blank to auto-generate (e.g. A-01)'}
              disabled={!!editing}
              className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40 disabled:opacity-60"
            />
            {editing && (
              <p className="text-[10px] text-slate-500 font-medium">The slot code is auto-generated and cannot be changed.</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Floor</label>
            <CustomSelect
              value={form.floor}
              onChange={(val) => setForm((f) => ({ ...f, floor: val, zone: '' }))}
              options={[
                { value: '', label: 'Select floor' },
                ...floors.map((fl) => ({
                  value: fl._id,
                  label: fl.name ? `${fl.code} — ${fl.name}` : fl.code,
                })),
              ]}
              placeholder="Select floor..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Zone</label>
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
            <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
              The slot vehicle type is <strong>taken automatically from the floor allowed types</strong> (configured in the Floors tab); no need to set it here.
            </p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Status</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as ParkingSlot['status'] }))}
              options={SLOT_STATUSES.map((s) => ({
                value: s,
                label: s === 'available' ? 'Available' : s === 'occupied' ? 'Occupied' : s === 'reserved' ? 'Reserved' : 'Maintenance',
              }))}
            />
          </div>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-700 md:col-span-2 select-none">
            <input
              type="checkbox"
              checked={form.reservable}
              onChange={(e) => setForm((f) => ({ ...f, reservable: e.target.checked }))}
              className="w-4 h-4 rounded border-blue-150 bg-white text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Allow advance reservation</span>
          </label>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Notes</label>
            <Input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
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
        defaultFloor={floorFilter}
        defaultQuantity={batchQty}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete slot"
        description={`Delete slot ${deleteTarget?.code}?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        isConfirming={deleting}
      />
    </div>
  );
}
