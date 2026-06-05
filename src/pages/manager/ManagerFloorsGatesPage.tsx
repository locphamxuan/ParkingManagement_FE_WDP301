import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, GitBranch, Layers, ArrowRightLeft, LogIn, LogOut } from 'lucide-react';
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
  capacity: string;
  status: Floor['status'];
  allowedVehicleTypes: string[];
}

const emptyFloor: FloorForm = {
  code: '',
  capacity: '0',
  status: 'active',
  allowedVehicleTypes: [],
};

function FloorsSection({
  buildingId, floors, vehicleTypes, loading, error, onRefresh,
}: {
  buildingId: string; floors: Floor[]; vehicleTypes: VehicleType[];
  loading: boolean; error: string | null; onRefresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [form, setForm] = useState<FloorForm>(emptyFloor);

  const openCreate = () => { setEditing(null); setForm(emptyFloor); setModalOpen(true); };
  const openEdit = (row: Floor) => {
    setEditing(row);
    setForm({
      code: row.code,
      capacity: String(row.capacity),
      status: row.status,
      allowedVehicleTypes: row.allowedVehicleTypes.map((v) => (typeof v === 'string' ? v : v._id)),
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    const payload = {
      code: form.code.trim().toUpperCase(),
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
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capacity</label>
            <Input
              type="number"
              min={0}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
            <select
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Floor['status'] }))}
            >
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

// ─── Gate section (read-only, status-edit only) ───────────────────────────────

const directionLabel: Record<Gate['direction'], string> = {
  in: 'Entry',
  out: 'Exit',
  both: 'Entry & Exit',
};

const directionIcon: Record<Gate['direction'], React.ReactNode> = {
  in: <LogIn size={14} className="text-emerald-400" />,
  out: <LogOut size={14} className="text-rose-400" />,
  both: <ArrowRightLeft size={14} className="text-blue-400" />,
};

function GatesSection({
  buildingId, gates, loading, error, onRefresh,
}: {
  buildingId: string; gates: Gate[];
  loading: boolean; error: string | null; onRefresh: () => void;
}) {
  const [editingGate, setEditingGate] = useState<Gate | null>(null);
  const [editStatus, setEditStatus] = useState<Gate['status']>('active');
  const [saving, setSaving] = useState(false);

  const openStatusEdit = (gate: Gate) => {
    setEditingGate(gate);
    setEditStatus(gate.status);
  };

  const saveStatus = async () => {
    if (!editingGate) return;
    setSaving(true);
    try {
      await managerApi.gates.update(buildingId, editingGate._id, { status: editStatus } as Parameters<typeof managerApi.gates.update>[2]);
      setEditingGate(null);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <GitBranch size={16} className="text-orange-400" />
        <h2 className="text-sm font-bold text-white">Gates</h2>
        <span className="text-xs text-muted-foreground ml-1">— Fixed entry &amp; exit gates apply to all floors</span>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading gates...</div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : gates.length === 0 ? (
        <div className="rounded-lg border border-white/8 bg-white/3 px-5 py-4 text-sm text-muted-foreground">
          No gates configured yet. Contact your system administrator.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {gates.map((gate) => (
            <div key={gate._id}
              className="rounded-xl border border-white/8 bg-white/3 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/8">
                  {directionIcon[gate.direction]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-white">{gate.code}</span>
                    {gate.name && <span className="text-xs text-muted-foreground">{gate.name}</span>}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{directionLabel[gate.direction]}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={gate.status} />
                <Button size="sm" variant="ghost" onClick={() => openStatusEdit(gate)}>
                  <Pencil size={13} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status edit modal */}
      {editingGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Edit Gate Status — {editingGate.code}</h3>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">Status</label>
              <select
                className="h-10 rounded-md border border-border bg-card px-3 text-sm w-full"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as Gate['status'])}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditingGate(null)} className="flex-1">Cancel</Button>
              <Button onClick={saveStatus} disabled={saving} className="flex-1">
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
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
        loading={loading}
        error={error}
        onRefresh={refresh}
      />
    </div>
  );
}
