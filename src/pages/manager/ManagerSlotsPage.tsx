import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Layers, RotateCcw, CheckCircle2, Wrench, Activity, Sparkles, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { MultiSlotForm, type SlotFormRow } from '@/components/manager/MultiSlotForm';
import { Slot3DBox } from '@/components/manager/Slot3DBox';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  ZONE_USAGE_LABELS,
  type Floor,
  type ParkingSlot,
  type VehicleType,
  type Zone,
} from '@/services/manager/managerApi';

interface FormState {
  code: string;
  floor: string;
  zone: string;
  status: ParkingSlot['status'];
  reservable: boolean;
  note: string;
}

const empty: FormState = {
  code: '',
  floor: '',
  zone: '',
  status: 'available',
  reservable: true,
  note: '',
};

const zoneFloorId = (z: Zone) => (typeof z.floor === 'string' ? z.floor : z.floor._id);

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
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

  // Compute live slots stats for the dashboard header
  const stats = useMemo(() => {
    const total = items.length;
    const available = items.filter((s) => s.status === 'available').length;
    const occupied = items.filter((s) => s.status === 'occupied').length;
    const reserved = items.filter((s) => s.status === 'reserved').length;
    const maintenance = items.filter((s) => s.status === 'maintenance').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { total, available, occupied, reserved, maintenance, occupancyRate };
  }, [items]);

  // Interactive cockpit rotation state values for 3D stacks
  const [rx, setRx] = useState(30);
  const [rz, setRz] = useState(0);
  const [zoom, setZoom] = useState(1.2);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, floorsRes, zonesRes, vtRes] = await Promise.all([
        managerApi.slots.list(buildingId, {
          floor: floorFilter || undefined,
          status: statusFilter || undefined,
        }),
        managerApi.floors.list(buildingId),
        managerApi.zones.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      setItems(slotsRes.data.items);
      setFloors(floorsRes.data.items);
      setZones(zonesRes.data.items);
      setVehicleTypes(vtRes.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
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
    setMultiSlotModalOpen(true);
  };

  const openEdit = (row: ParkingSlot) => {
    const floorId = typeof row.floor === 'string' ? row.floor : row.floor._id;
    const zoneId = !row.zone ? '' : typeof row.zone === 'string' ? row.zone : row.zone._id;
    setEditing(row);
    setForm({
      code: row.code,
      floor: floorId,
      zone: zoneId,
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
      alert('Please select a zone');
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
      key: 'zone',
      title: 'Zone',
      render: (row) => {
        if (!row.zone) return '—';
        if (typeof row.zone === 'object') return row.zone.code;
        const z = zones.find((zz) => zz._id === row.zone);
        return z ? z.code : '?';
      },
    },
    {
      key: 'vehicleType',
      title: 'Vehicle type',
      render: (row) => {
        if (!row.vehicleType) return '—';
        if (typeof row.vehicleType === 'object') return row.vehicleType.name;
        const vt = vehicleTypes.find((v) => v._id === row.vehicleType);
        return vt ? vt.name : '?';
      },
    },
    {
      key: 'usageType',
      title: 'Usage',
      render: (row) => (row.usageType ? ZONE_USAGE_LABELS[row.usageType] : '—'),
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
            label: s === 'available' ? 'Available' : s === 'occupied' ? 'Full' : s === 'reserved' ? 'Reservation' : 'Maintenance',
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
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)} className="hover:bg-primary/10 hover:text-primary">
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)} className="hover:bg-rose-500/10 hover:text-rose-600">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-6 animate-fadeIn text-foreground">
      
      {/* Dynamic Summary Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Slots */}
        <div className="bg-white border border-sky-100 border-l-4 border-l-slate-400 rounded-3xl p-4 shadow-sm flex items-center gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/50 text-slate-550 shrink-0">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Total slots</div>
            <div className="text-2xl font-black text-slate-800 font-mono mt-0.5">{stats.total}</div>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white border border-sky-100 border-l-4 border-l-emerald-500 rounded-3xl p-4 shadow-sm flex items-center gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100/50 text-emerald-500 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Available</div>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">{stats.available}</div>
          </div>
        </div>

        {/* Occupied */}
        <div className="bg-white border border-sky-100 border-l-4 border-l-rose-500 rounded-3xl p-4 shadow-sm flex items-center gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100/50 text-rose-500 shrink-0">
            <Activity size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Occupied</div>
            <div className="text-2xl font-black text-rose-600 font-mono mt-0.5">{stats.occupied}</div>
          </div>
        </div>

        {/* Reserved */}
        <div className="bg-white border border-sky-100 border-l-4 border-l-sky-500 rounded-3xl p-4 shadow-sm flex items-center gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100/50 text-sky-500 shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Reserved</div>
            <div className="text-2xl font-black text-sky-600 font-mono mt-0.5">{stats.reserved}</div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white border border-sky-100 border-l-4 border-l-amber-500 rounded-3xl p-4 shadow-sm flex items-center gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100/50 text-amber-550 shrink-0">
            <Wrench size={18} />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Maintenance</div>
            <div className="text-2xl font-black text-amber-600 font-mono mt-0.5">{stats.maintenance}</div>
          </div>
        </div>
      </div>

      {/* Sci-fi Controller & Toggle Row */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-sky-100 shadow-sm">
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
                label: s === 'available' ? 'Available (Green)' : s === 'occupied' ? 'Full (Orange)' : s === 'reserved' ? 'Reserved (Blue)' : 'Maintenance (Amber)',
              })),
            ]}
            className="w-48"
          />
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-xl bg-slate-100 border border-sky-100/50 p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'list' 
                ? 'bg-sky-500 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >Table view</button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === '3d' 
                ? 'bg-sky-500 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >3D Hologram map</button>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={openCreate} className="rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider shadow-md hover:brightness-110 gap-2">
            <Plus size={14} className="stroke-[3]" />Add slot</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500 flex items-center justify-center p-24 bg-white rounded-3xl border border-sky-100 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />Loading slot data...</div>
      ) : error ? (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-100 p-6 rounded-3xl shadow-sm">{error}</div>
      ) : (
        <div>
          {viewMode === 'list' ? (
            <div className="bg-white rounded-3xl border border-sky-100 p-6 shadow-sm">
              <DataTable title={`Slots (${items.length})`} rows={items} columns={columns} />
            </div>
          ) : (
            /* Sci-Fi 3D Visual Map Mode */
            <div className="grid gap-6 xl:grid-cols-[1fr,300px]">
              
              {/* 3D Map Viewport */}
              <div className="h-[620px] relative rounded-3xl border border-sky-100 bg-slate-50/50 shadow-sm overflow-hidden flex items-center justify-center">
                
                {/* Multi-layer space backing grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
                {/* Radial dot texture */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.015)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                {/* Central halo */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.03),transparent_75%)] pointer-events-none" />
                
                {/* 3D Render Stack Container */}
                <div className="perspective-1000 w-full h-full flex items-center justify-center preserve-3d">
                  <motion.div
                    style={{
                      rotateX: rx,
                      rotateZ: rz,
                      scale: zoom,
                      transformStyle: 'preserve-3d',
                    }}
                    className="isometric-mesh relative w-[500px] h-[400px] preserve-3d transition-transform duration-200"
                  >
                    {/* Render Floors stacked dynamically */}
                    {floors.map((floor, fIdx) => {
                      // Apply filter check
                      if (floorFilter && floor._id !== floorFilter) return null;
                      
                      const floorSlots = slotsByFloor[floor._id] || [];
                      // Vertical offset layout for vertical stacking
                      const zOffset = floorFilter ? 0 : (fIdx * 130);

                      return (
                        <motion.div
                          key={floor._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: fIdx * 0.06, type: 'spring', stiffness: 120, damping: 18 }}
                          style={{
                            transform: `translateZ(${zOffset}px)`,
                            transformStyle: 'preserve-3d',
                          }}
                          className="absolute inset-0 rounded-3xl border border-sky-100 bg-gradient-to-b from-white/90 to-white/70 backdrop-blur-sm shadow-[0_20px_40px_rgba(14,165,233,0.08)] preserve-3d p-6 flex flex-col justify-between overflow-hidden"
                        >
                          {/* Animated laser scan line sweeping vertically */}
                          <div className="animate-scan-sweep" />

                          {/* Corner L-Markers */}
                          <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-sky-250 pointer-events-none" />
                          <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-sky-250 pointer-events-none" />
                          <div className="absolute bottom-3 left-3 w-2 h-2 border-b border-l border-sky-250 pointer-events-none" />
                          <div className="absolute bottom-3 right-3 w-2 h-2 border-b border-r border-sky-250 pointer-events-none" />

                          {/* Subtle Lane Guide Lines */}
                          <div className="absolute top-1/2 left-4 right-4 h-[1px] border-t border-dashed border-sky-100/50 -translate-y-1/2 pointer-events-none" />

                          {/* Subtle Floor helper labels */}
                          <div className="absolute bottom-3 left-6 text-[7px] font-black tracking-widest text-slate-300/80 uppercase font-mono pointer-events-none">ENTRY POINT</div>
                          <div className="absolute bottom-3 right-6 text-[7px] font-black tracking-widest text-slate-300/80 uppercase font-mono pointer-events-none">EXIT POINT</div>
                          <div className="absolute top-3 left-6 text-[7px] font-black tracking-widest text-slate-350/80 uppercase font-mono pointer-events-none">PRIMARY ZONE</div>

                          {/* Floor label badge */}
                          <div className="flex justify-between items-center mb-4 z-10 preserve-3d" style={{ transform: 'translateZ(15px)' }}>
                            <span className="text-[10px] font-black tracking-widest text-sky-600 uppercase font-mono bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                              FLOOR {floor.code}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 font-mono">
                              CAPACITY: {floorSlots.filter(s => s.status === 'occupied').length}/{floorSlots.length} SLOT
                            </span>
                          </div>

                          {/* Grid Layout of Slot blocks */}
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-6 my-auto items-center justify-items-center preserve-3d" style={{ transform: 'translateZ(10px)' }}>
                            {floorSlots.length === 0 ? (
                              <div className="col-span-full text-center text-slate-400 text-xs py-10 uppercase tracking-widest font-mono">No slots configured</div>
                            ) : (
                              floorSlots.map((slot) => (
                                <Slot3DBox 
                                  key={slot._id} 
                                  slot={slot} 
                                  onClick={() => setSelectedSlot(slot)} 
                                  statusFilter={statusFilter}
                                  vehicleTypes={vehicleTypes}
                                  isSelected={selectedSlot?._id === slot._id}
                                />
                              ))
                            )}
                          </div>

                          <div className="text-[8px] text-slate-455 font-black tracking-widest uppercase font-mono text-right preserve-3d mt-4" style={{ transform: 'translateZ(5px)' }}>
                            {floor.code} ARCHITECTURE
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Stronger Map Header */}
                <div className="absolute left-6 top-6 right-6 flex flex-wrap justify-between items-start z-20 pointer-events-none gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      3D Parking Layout
                    </h4>
                    <p className="text-[9px] text-slate-400 font-medium">
                      Live spatial overview of parking slots on the selected floor
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase font-mono tracking-wider">
                      {items.length} slots
                    </span>
                    {floorFilter && (
                      <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase font-mono tracking-wider">
                        Floor: {floors.find(f => f._id === floorFilter)?.code || 'Selected'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sci-Fi Right Cockpit Control Panel */}
              <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[500px]">
                {selectedSlot ? (
                  /* SELECTED SLOT DETAILS PROPERTIES PANEL */
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between pb-2.5 border-b border-sky-100">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />Slot Details
                      </h3>
                      <button 
                        onClick={() => setSelectedSlot(null)}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors font-mono"
                      >Deselect</button>
                    </div>

                    <div className="space-y-4">
                      {/* Slot code */}
                      <div className="bg-sky-50/30 border border-sky-100/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono font-bold">Selected slot</span>
                        <span className="text-2xl font-black text-sky-950 font-mono mt-1">{selectedSlot.code}</span>
                      </div>

                      {/* Info grid */}
                      <div className="grid gap-3 text-xs">
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-slate-400 font-medium">Floor</span>
                          <span className="font-semibold text-slate-800 font-mono uppercase">
                            {typeof selectedSlot.floor === 'object' ? selectedSlot.floor.code : floors.find(f => f._id === selectedSlot.floor)?.code || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-slate-400 font-medium">Vehicle type</span>
                          <span className="font-semibold text-slate-800">
                            {(() => {
                              const vt = selectedSlot.vehicleType;
                              if (!vt) return '— Not fixed —';
                              if (typeof vt === 'object') return vt.name;
                              return vehicleTypes.find(v => v._id === vt)?.name || 'Vehicle Type';
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-slate-400 font-medium">Status</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase font-mono border",
                            selectedSlot.status === 'available' && "bg-emerald-50 border-emerald-200 text-emerald-600",
                            selectedSlot.status === 'occupied' && "bg-rose-50 border-rose-200 text-rose-600",
                            selectedSlot.status === 'reserved' && "bg-sky-50 border-sky-200 text-sky-600",
                            selectedSlot.status === 'maintenance' && "bg-amber-50 border-amber-200 text-amber-600"
                          )}>
                            {selectedSlot.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50">
                          <span className="text-slate-400 font-medium">Reservation</span>
                          <span className="font-semibold text-slate-800">
                            {selectedSlot.reservable ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        {selectedSlot.note && (
                          <div className="flex flex-col gap-1 py-1">
                            <span className="text-slate-400 font-medium">Note</span>
                            <span className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 italic text-[11px]">
                              {selectedSlot.note}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-sky-100">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => openEdit(selectedSlot)}
                        className="rounded-xl font-bold text-xs gap-1.5"
                      >
                        <Pencil size={12} />Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          onDelete(selectedSlot);
                          setSelectedSlot(null);
                        }}
                        className="rounded-xl font-bold text-xs gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-rose-100 hover:border-rose-200"
                      >
                        <Trash2 size={12} />Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* STANDARD COCKPIT PANEL AND STATUS LEGEND */
                  <>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 font-mono mb-4 flex items-center gap-1.5 pb-2.5 border-b border-sky-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />Spatial view</h3>
                      
                      {/* Cockpit Angle Tilt Controls */}
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
                            <span>X Tilt</span>
                            <span className="text-sky-600 font-mono">{rx}°</span>
                          </div>
                          <input 
                            type="range" 
                            min="20" 
                            max="85" 
                            value={rx} 
                            onChange={(e) => setRx(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 border border-sky-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
                            <span>Z Rotation</span>
                            <span className="text-sky-600 font-mono">{rz}°</span>
                          </div>
                          <input 
                            type="range" 
                            min="-180" 
                            max="180" 
                            value={rz} 
                            onChange={(e) => setRz(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 border border-sky-100"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
                            <span>Zoom</span>
                            <span className="text-sky-600 font-mono">{Math.round(zoom * 100)}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="2" 
                            step="0.05"
                            value={zoom} 
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500 border border-sky-100"
                          />
                        </div>

                        <button 
                          onClick={() => { setRx(30); setRz(0); setZoom(1.2); }}
                          className="w-full py-2.5 rounded-xl border border-sky-200 hover:border-sky-300 text-sky-700 bg-sky-50/50 hover:bg-sky-100/50 font-mono text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <RotateCcw size={12} /> Reset View
                        </button>
                      </div>

                      {/* Live occupancy progress */}
                      <div className="mt-6 pt-4 border-t border-sky-100 space-y-4">
                        <div>
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono mb-1.5">
                            <span>Occupancy rate</span>
                            <span className="text-sky-600 font-mono">{stats.occupancyRate}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                            <div 
                              className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-500" 
                              style={{ width: `${stats.occupancyRate}%` }}
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="mt-8 pt-4 border-t border-sky-100 space-y-3">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono mb-2">Status legend</div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 bg-sky-50/30 p-2.5 rounded-xl border border-sky-100">
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-300" />Available</span>
                        <span className="font-mono text-emerald-600 font-black">
                          {stats.available}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 bg-sky-50/30 p-2.5 rounded-xl border border-sky-100">
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-red-50 border border-red-300" />Occupied</span>
                        <span className="font-mono text-red-650 font-black">
                          {stats.occupied}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 bg-sky-50/30 p-2.5 rounded-xl border border-sky-100">
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-sky-50 border border-sky-300" />Reserved</span>
                        <span className="font-mono text-sky-600 font-black">
                          {stats.reserved}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 bg-sky-50/30 p-2.5 rounded-xl border border-sky-100">
                        <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-300" />Maintenance</span>
                        <span className="font-mono text-amber-600 font-black">
                          {stats.maintenance}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
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
        <div className="grid gap-4 md:grid-cols-2 text-foreground">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground font-mono">Slot code</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="bg-card border-border text-foreground rounded-xl focus:border-primary/45"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground font-mono">Floor</label>
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
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground font-mono">Zone</label>
            <CustomSelect
              value={form.zone}
              onChange={(val) => setForm((f) => ({ ...f, zone: val }))}
              options={[
                { value: '', label: 'Select zone' },
                ...zones
                  .filter((z) => zoneFloorId(z) === form.floor)
                  .map((z) => {
                    const full = (z.capacity ?? 0) > 0 && (z.slotCount ?? 0) >= (z.capacity ?? 0);
                    return { value: z._id, label: `${z.code} · ${ZONE_USAGE_LABELS[z.usageType]} · ${z.slotCount ?? 0}/${z.capacity ?? 0}${full ? ' (full)' : ''}` };
                  }),
              ]}
              placeholder="Select zone..."
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <p className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-[11px] text-sky-700">The slot's vehicle type &amp; usage are <strong>taken from the selected Zone</strong> — configure them in the "Zones" tab.</p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground font-mono">Status</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as ParkingSlot['status'] }))}
              options={SLOT_STATUSES.map((s) => ({
                value: s,
                label: s === 'available' ? 'Available' : s === 'occupied' ? 'Full' : s === 'reserved' ? 'Reservation' : 'Maintenance',
              }))}
            />
          </div>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-705 md:col-span-2 select-none">
            <input
              type="checkbox"
              checked={form.reservable}
              onChange={(e) => setForm((f) => ({ ...f, reservable: e.target.checked }))}
              className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Allow advance booking</span>
          </label>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground font-mono">Note</label>
            <Input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="bg-card border-border text-foreground rounded-xl focus:border-primary/45"
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
