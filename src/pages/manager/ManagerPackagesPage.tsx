import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Ticket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type LongTermPackage, type VehicleType } from '@/services/manager/managerApi';
import { showToast } from '@/components/common/ToastNotification';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

interface FormState {
  code: string;
  name: string;
  vehicleType: string;
  durationDays: string;
  price: string;
  maxHoursPerDay: string;
  description: string;
  benefits: string;
  isActive: boolean;
}

const empty: FormState = {
  code: '',
  name: '',
  vehicleType: '',
  durationDays: '30',
  price: '0',
  maxHoursPerDay: '',
  description: '',
  benefits: '',
  isActive: true,
};

export function ManagerPackagesPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<LongTermPackage[]>([]);
  const [vts, setVts] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LongTermPackage | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, vtList] = await Promise.all([
        managerApi.packages.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      setItems(list.data.items);
      setVts(vtList.data.items);
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
    setForm({ ...empty, vehicleType: vts[0]?._id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (row: LongTermPackage) => {
    setEditing(row);
    setForm({
      code: row.code,
      name: row.name,
      vehicleType: typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType._id,
      durationDays: String(row.durationDays),
      price: String(row.price),
      maxHoursPerDay: row.maxHoursPerDay != null ? String(row.maxHoursPerDay) : '',
      description: row.description ?? '',
      benefits: (row.benefits ?? []).join('\n'),
      isActive: row.isActive,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!form.vehicleType) {
      showToast('Select a vehicle type first', 'error');
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      vehicleType: form.vehicleType,
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      // Để trống → BE tự đặt mặc định theo thời hạn (tuần 5 / tháng 7 / năm 10).
      ...(form.maxHoursPerDay.trim() !== '' ? { maxHoursPerDay: Number(form.maxHoursPerDay) } : {}),
      description: form.description.trim(),
      benefits: form.benefits
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean),
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await managerApi.packages.update(buildingId, editing._id, payload);
      } else {
        await managerApi.packages.create(buildingId, payload);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  // Xác nhận qua ConfirmModal (bỏ window.confirm native).
  const [deleteTarget, setDeleteTarget] = useState<LongTermPackage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const onDelete = (row: LongTermPackage) => setDeleteTarget(row);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await managerApi.packages.remove(buildingId, deleteTarget._id);
      showToast('Package deleted', 'success');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataColumn<LongTermPackage>[] = [
    { key: 'code', title: 'Code' },
    { key: 'name', title: 'Name' },
    {
      key: 'vehicleType',
      title: 'Vehicle type',
      render: (row) => (typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType.code),
    },
    { key: 'durationDays', title: 'Duration (days)' },
    {
      key: 'price',
      title: 'Price',
      render: (row) => `${row.price.toLocaleString('vi-VN')} đ`,
    },
    {
      key: 'maxHoursPerDay',
      title: 'Free hours/day',
      render: (row) =>
        row.maxHoursPerDay && row.maxHoursPerDay > 0 ? `${row.maxHoursPerDay}h` : 'Unlimited',
    },
    {
      key: 'benefits',
      title: 'Benefits',
      render: (row) => (
        <span className="text-xs text-slate-400">
          {(row.benefits?.length ?? 0) > 0 ? `${row.benefits!.length} benefits` : '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
              Policies & Subscriptions
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Ticket size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
              Subscription Packages
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Configure long-term parking passes, custom durations, and multi-vehicle bundle discounts.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              onClick={openCreate}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Plus size={14} className="stroke-[3] mr-1.5" /> Add package
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-650 text-xs font-bold p-8 justify-center bg-white rounded-2xl border-2 border-blue-100 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
          <span>Loading packages...</span>
        </div>
      ) : error ? (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{error}</p>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-blue-100 p-6 shadow-sm">
          <DataTable title="Long-term packages" rows={items} columns={columns} />
        </div>
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit long-term package' : 'Add long-term package'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2 text-slate-800">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Code</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Vehicle type</label>
            <CustomSelect
              value={form.vehicleType}
              onChange={(val) => setForm((f) => ({ ...f, vehicleType: val }))}
              options={[
                { value: '', label: 'Select' },
                ...vts.map((vt) => ({
                  value: vt._id,
                  label: `${vt.code} - ${vt.name}`,
                })),
              ]}
              placeholder="Select vehicle type..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Duration (days)</label>
            <Input
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
              className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Price (VND)</label>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Free hours / day</label>
            <Input
              type="number"
              min={0}
              placeholder="Leave empty = auto by duration"
              value={form.maxHoursPerDay}
              onChange={(e) => setForm((f) => ({ ...f, maxHoursPerDay: e.target.value }))}
              className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40 placeholder-slate-400"
            />
            <p className="text-[11px] text-slate-500">
              Free parking hours/day. Overage is charged at the regular rate. Leave empty → default weekly 5h / monthly 7h / yearly 10h. 0 = unlimited.
              The package does NOT reserve a fixed slot — staff assign a free slot on entry.
            </p>
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Description</label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Package benefits (one per line)
            </label>
            <textarea
              value={form.benefits}
              onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
              rows={4}
              placeholder={'Unlimited free parking entries\nPriority slots near the elevator\nOne free car wash per month'}
              className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500/40 placeholder-slate-400"
            />
            <p className="text-[11px] text-slate-500">
              These benefits are shown to customers when purchasing the package.
            </p>
          </div>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-700 md:col-span-2 select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-blue-150 bg-white text-blue-500 focus:ring-0 cursor-pointer"
            />
            <span>On sale</span>
          </label>
        </div>
      </ModalForm>
    <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete package"
        description={`Delete package "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        isConfirming={deleting}
      />
    </div>
  );
}
