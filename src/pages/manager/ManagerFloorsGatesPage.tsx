import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, GitBranch, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ModalForm } from '@/components/shared/ModalForm';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Floor, type Gate, type VehicleType } from '@/services/manager/managerApi';

// ─── Floor section ────────────────────────────────────────────────────────────

interface FloorForm {
  code: string;
  name: string;
  levelNumber: string;
  capacity: string;
  status: Floor['status'];
  allowedVehicleTypes: string[];
}

const emptyFloor: FloorForm = {
  code: '',
  name: '',
  levelNumber: '1',
  capacity: '0',
  status: 'active',
  allowedVehicleTypes: [],
};

function FloorsSection({
  buildingId,
  floors,
  vehicleTypes,
  loading,
  error,
  onRefresh,
}: {
  buildingId: string;
  floors: Floor[];
  vehicleTypes: VehicleType[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [form, setForm] = useState<FloorForm>(emptyFloor);

  const openCreate = () => { setEditing(null); setForm(emptyFloor); setModalOpen(true); };
  const openEdit = (row: Floor) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      levelNumber: String(row.levelNumber),
      capacity: String(row.capacity),
      status: row.status,
      allowedVehicleTypes: row.allowedVehicleTypes.map((v) => (typeof v === 'string' ? v : v._id)),
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      levelNumber: Number(form.levelNumber),
      capacity: Number(form.capacity),
      status: form.status,
      allowedVehicleTypes: form.allowedVehicleTypes,
    };
    try {
      if (editing) {
        await managerApi.floors.update(buildingId, editing._id, payload as Parameters<typeof managerApi.floors.update>[2]);
      } else {
        await managerApi.floors.create(buildingId, payload as Parameters<typeof managerApi.floors.create>[1]);
      }
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const onDelete = async (row: Floor) => {
    if (!window.confirm(`Delete floor ${row.code}?`)) return;
    try {
      await managerApi.floors.remove(buildingId, row._id);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const toggleVT = (id: string) =>
    setForm((f) => ({
      ...f,
      allowedVehicleTypes: f.allowedVehicleTypes.includes(id)
        ? f.allowedVehicleTypes.filter((x) => x !== id)
        : [...f.allowedVehicleTypes, id],
    }));

  const columns: DataColumn<Floor>[] = useMemo(() => [
    { key: 'code', title: 'Code' },
    { key: 'name', title: 'Location' },
    { key: 'capacity', title: 'Capacity' },
    {
      key: 'allowedVehicleTypes',
      title: 'Vehicle Types',
      render: (row) =>
        row.allowedVehicleTypes.map((v) => (typeof v === 'string' ? v : v.code)).join(', ') || '—',
    },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}><Pencil size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ], [vehicleTypes]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <Layers size={16} className="text-orange-400" /> Floors
        </h2>
        <Button onClick={openCreate} size="sm" className="gap-2"><Plus size={13} /> Add Floor</Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading floors...</div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <DataTable title="Floor List" rows={floors} columns={columns} />
      )}

      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Floor' : 'Add Floor'} onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Floor Code</label>
            <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="E.g. F1, B1, GF" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location Name</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="E.g. Basement, Ground, Floor 1" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level Number</label>
            <Input type="number" value={form.levelNumber} onChange={(e) => setForm((f) => ({ ...f, levelNumber: e.target.value }))} className="[appearance:textfield]" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capacity</label>
            <Input type="number" min={0} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} className="[appearance:textfield]" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
            <select className="h-10 rounded-md border border-border bg-card px-3 text-sm" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Floor['status'] }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Allowed Vehicle Types</label>
            <div className="flex flex-wrap gap-2">
              {vehicleTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No vehicle types yet. Create vehicle types first.</p>
              ) : vehicleTypes.map((vt) => {
                const active = form.allowedVehicleTypes.includes(vt._id);
                return (
                  <button type="button" key={vt._id} onClick={() => toggleVT(vt._id)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${active ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-muted/40 text-muted-foreground'}`}>
                    {vt.code} – {vt.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ModalForm>
    </>
  );
}

// ─── Gate section ─────────────────────────────────────────────────────────────

type GateFloor = { _id: string; code: string; name: string; levelNumber: number };

interface GateForm {
  code: string;
  name: string;
  direction: 'in' | 'out' | 'both';
  status: Gate['status'];
  allowedVehicleTypes: string[];
  floors: string[];
}

const emptyGate: GateForm = {
  code: '',
  name: '',
  direction: 'both',
  status: 'active',
  allowedVehicleTypes: [],
  floors: [],
};

const directionLabel: Record<Gate['direction'], string> = {
  in: '→ Entry',
  out: '← Exit',
  both: '↔ Both',
};

function GatesSection({
  buildingId,
  gates,
  floors,
  vehicleTypes,
  loading,
  error,
  onRefresh,
}: {
  buildingId: string;
  gates: Gate[];
  floors: Floor[];
  vehicleTypes: VehicleType[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Gate | null>(null);
  const [form, setForm] = useState<GateForm>(emptyGate);

  const openCreate = () => { setEditing(null); setForm(emptyGate); setModalOpen(true); };
  const openEdit = (row: Gate) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name || '',
      direction: row.direction,
      status: row.status,
      allowedVehicleTypes: row.allowedVehicleTypes.map((v) => (typeof v === 'string' ? v : v._id)),
      floors: (row.floors as GateFloor[]).map((f) => (typeof f === 'string' ? f : f._id)),
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      direction: form.direction,
      status: form.status,
      allowedVehicleTypes: form.allowedVehicleTypes,
      floors: form.floors,
    };
    try {
      if (editing) {
        await managerApi.gates.update(buildingId, editing._id, payload as Parameters<typeof managerApi.gates.update>[2]);
      } else {
        await managerApi.gates.create(buildingId, payload as Parameters<typeof managerApi.gates.create>[1]);
      }
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const onDelete = async (row: Gate) => {
    if (!window.confirm(`Delete gate ${row.code}?`)) return;
    try {
      await managerApi.gates.remove(buildingId, row._id);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const toggleVT = (id: string) =>
    setForm((f) => ({
      ...f,
      allowedVehicleTypes: f.allowedVehicleTypes.includes(id)
        ? f.allowedVehicleTypes.filter((x) => x !== id)
        : [...f.allowedVehicleTypes, id],
    }));

  const toggleFloor = (id: string) =>
    setForm((f) => ({
      ...f,
      floors: f.floors.includes(id) ? f.floors.filter((x) => x !== id) : [...f.floors, id],
    }));

  const columns: DataColumn<Gate>[] = useMemo(() => [
    { key: 'code', title: 'Code' },
    { key: 'name', title: 'Name', render: (row) => row.name || '—' },
    { key: 'direction', title: 'Direction', render: (row) => directionLabel[row.direction] },
    {
      key: 'floors',
      title: 'Serves Floors',
      render: (row) => {
        const fl = row.floors as GateFloor[];
        return fl.length > 0
          ? fl.map((f) => (typeof f === 'string' ? f : f.code)).join(', ')
          : <span className="text-rose-400 text-xs italic">None — assign floors</span>;
      },
    },
    {
      key: 'allowedVehicleTypes',
      title: 'Vehicle Types',
      render: (row) => row.allowedVehicleTypes.map((v) => (typeof v === 'string' ? v : v.code)).join(', ') || '—',
    },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}><Pencil size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)}><Trash2 size={14} /></Button>
        </div>
      ),
    },
  ], [floors, vehicleTypes]);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <GitBranch size={16} className="text-orange-400" /> Gates
        </h2>
        <Button onClick={openCreate} size="sm" className="gap-2"><Plus size={13} /> Add Gate</Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading gates...</div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <DataTable title="Gate List" rows={gates} columns={columns} />
      )}

      <ModalForm open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit Gate' : 'Add Gate'} onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gate Code</label>
            <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="E.g. GA, GB" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gate Name</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="E.g. Main Entrance" />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Direction</label>
            <div className="flex gap-2">
              {(['in', 'out', 'both'] as const).map((dir) => (
                <button type="button" key={dir} onClick={() => setForm((f) => ({ ...f, direction: dir }))}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${form.direction === dir ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40'}`}>
                  {directionLabel[dir]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
            <select className="h-10 rounded-md border border-border bg-card px-3 text-sm" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Gate['status'] }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Serves Floors <span className="font-normal normal-case text-muted-foreground">(select the floors this gate serves — users can only book a floor that has a gate)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {floors.length === 0 ? (
                <p className="text-xs text-muted-foreground">No floors yet. Add floors first.</p>
              ) : floors.map((fl) => {
                const active = form.floors.includes(fl._id);
                return (
                  <button type="button" key={fl._id} onClick={() => toggleFloor(fl._id)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${active ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-muted/40 text-muted-foreground'}`}>
                    {fl.code} – {fl.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Allowed Vehicle Types</label>
            <div className="flex flex-wrap gap-2">
              {vehicleTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No vehicle types.</p>
              ) : vehicleTypes.map((vt) => {
                const active = form.allowedVehicleTypes.includes(vt._id);
                return (
                  <button type="button" key={vt._id} onClick={() => toggleVT(vt._id)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${active ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-muted/40 text-muted-foreground'}`}>
                    {vt.code} – {vt.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ModalForm>
    </>
  );
}

// ─── Combined page ────────────────────────────────────────────────────────────

export function ManagerFloorsGatesPage() {
  const { buildingId } = useBuildingContext();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [floorRes, gateRes, vtRes] = await Promise.all([
        managerApi.floors.list(buildingId),
        managerApi.gates.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      setFloors(floorRes.data.items);
      setGates(gateRes.data.items);
      setVehicleTypes(vtRes.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="grid gap-8">
      <FloorsSection
        buildingId={buildingId}
        floors={floors}
        vehicleTypes={vehicleTypes}
        loading={loading}
        error={error}
        onRefresh={refresh}
      />
      <hr className="border-white/8" />
      <GatesSection
        buildingId={buildingId}
        gates={gates}
        floors={floors}
        vehicleTypes={vehicleTypes}
        loading={loading}
        error={error}
        onRefresh={refresh}
      />
    </div>
  );
}
