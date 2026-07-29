import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Layers, Car, CheckCircle2, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Floor, type VehicleType } from '@/services/manager/managerApi';
import { showToast } from '@/components/common/ToastNotification';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

interface FormState {
  name: string;
  capacity: string;
  status: Floor['status'];
  allowedVehicleTypes: string[];
}

const empty: FormState = {
  name: '',
  capacity: '0',
  status: 'active',
  allowedVehicleTypes: [],
};

export function ManagerFloorsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Floor[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Floor | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [floors, vts] = await Promise.all([
        managerApi.floors.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      setItems(floors.data.items);
      setVehicleTypes(vts.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (row: Floor) => {
    setEditing(row);
    setForm({
      name: row.name ?? '',
      capacity: String(row.capacity),
      status: row.status,
      allowedVehicleTypes: row.allowedVehicleTypes.map((v) => (typeof v === 'string' ? v : v._id)),
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!form.name.trim()) return showToast('Please enter a floor name', 'error');
    // Mã tầng do BE tự sinh từ name — chỉ gửi name.
    const payload = {
      name: form.name.trim(),
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
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  // Xác nhận xóa qua ConfirmModal (bỏ window.confirm native).
  const [deleteTarget, setDeleteTarget] = useState<Floor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const onDelete = (row: Floor) => setDeleteTarget(row);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await managerApi.floors.remove(buildingId, deleteTarget._id);
      showToast('Floor deleted', 'success');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleType = (id: string) => {
    setForm((f) => ({
      ...f,
      allowedVehicleTypes: f.allowedVehicleTypes.includes(id)
        ? f.allowedVehicleTypes.filter((x) => x !== id)
        : [...f.allowedVehicleTypes, id],
    }));
  };

  const columns: DataColumn<Floor>[] = useMemo(
    () => [
      { key: 'code', title: 'Floor code' },
      { key: 'name', title: 'Floor name', render: (row) => row.name || '—' },
      { key: 'capacity', title: 'Capacity' },
      {
        key: 'allowedVehicleTypes',
        title: 'Allowed vehicle types',
        render: (row) =>
          row.allowedVehicleTypes
            .map((v) => (typeof v === 'string' ? v : `${v.code}`))
            .join(', ') || '—',
      },
      {
        key: 'status',
        title: 'Status',
        render: (row) => <StatusBadge status={row.status} />,
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
    ],
    [vehicleTypes]
  );

  const totalCapacity = useMemo(() => items.reduce((acc, x) => acc + (x.capacity || 0), 0), [items]);
  const activeFloorsCount = useMemo(() => items.filter((x) => x.status === 'active').length, [items]);
  const uniqueVehicleTypesCount = useMemo(() => {
    const ids = new Set<string>();
    items.forEach((item) => {
      item.allowedVehicleTypes?.forEach((v) => {
        ids.add(typeof v === 'string' ? v : v._id);
      });
    });
    return ids.size;
  }, [items]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              Facility Structure
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
              Floors & Levels
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Configure building levels, slot capacities, and permitted vehicle classes.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              onClick={openCreate}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Plus size={14} className="stroke-[3] mr-1.5" /> Add floor
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Low-Profile Summary Row (API Data Powered) */}
      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Total Levels', val: `${items.length} levels`, icon: Layers, borderLeft: 'border-l-blue-500', color: 'text-blue-650 bg-blue-50/50 border-blue-100' },
            { label: 'Total Capacity', val: `${totalCapacity} slots`, icon: Car, borderLeft: 'border-l-indigo-500', color: 'text-indigo-650 bg-indigo-50/50 border-indigo-100' },
            { label: 'Active Levels', val: `${activeFloorsCount} active`, icon: CheckCircle2, borderLeft: 'border-l-emerald-500', color: 'text-emerald-650 bg-emerald-50/50 border-emerald-100' },
            { label: 'Vehicle Classes', val: `${uniqueVehicleTypesCount} classes`, icon: Settings, borderLeft: 'border-l-purple-500', color: 'text-purple-650 bg-purple-50/50 border-purple-100' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`rounded-2xl border border-slate-200/80 border-l-4 ${stat.borderLeft} bg-white p-4 shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex items-center justify-between group select-none`}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-base font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">{stat.val}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${stat.color} group-hover:scale-105 transition-transform duration-355 shrink-0`}>
                  <Icon size={15} className="stroke-[2.5]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Table Card */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold p-8 justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="animate-spin mr-2" size={16} />
          <span>Loading floor configurations...</span>
        </div>
      ) : error ? (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{error}</p>
      ) : (
        <DataTable title="Floors" rows={items} columns={columns} />
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit floor' : 'Add floor'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3.5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Floor name</label>
            <Input
              value={form.name}
              placeholder="e.g. Floor 1, Basement B1"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-10 rounded-xl"
            />
            <p className="text-[10px] font-bold text-slate-500 mt-0.5 leading-normal">
              {editing
                ? `Floor code: ${editing.code} (auto-generated, cannot be changed)`
                : 'The floor code is auto-generated from the name (e.g. "Floor 1" → F1).'}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Capacity</label>
            <Input
              type="number"
              min={0}
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Status</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as Floor['status'] }))}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'maintenance', label: 'Maintenance' },
              ]}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Allowed vehicle types</label>
            <div className="flex flex-wrap gap-2">
              {vehicleTypes.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No vehicle types. Create them first.</p>
              ) : (
                vehicleTypes.map((vt) => {
                  const active = form.allowedVehicleTypes.includes(vt._id);
                  return (
                    <button
                      type="button"
                      key={vt._id}
                      onClick={() => toggleType(vt._id)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-slate-350'
                      }`}
                    >
                      {vt.code} - {vt.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </ModalForm>
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete floor"
        description={`Delete floor ${deleteTarget?.name || deleteTarget?.code}? The floor must have no zones or slots.`}
        onConfirm={confirmDelete}
        isConfirming={deleting}
      />
    </div>
  );
}
