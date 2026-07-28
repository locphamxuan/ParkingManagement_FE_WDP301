import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, PowerOff, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { TimePicker } from '@/components/ui/time-picker';
import { DatePicker } from '@/components/ui/date-picker';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type PricePolicy, type VehicleType } from '@/services/manager/managerApi';
import { showToast } from '@/components/common/ToastNotification';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

type PricingType = 'regular' | 'peak';

interface FormState {
  name: string;
  vehicleType: string;
  type: PricingType;
  hourlyRate: string;
  fromTime: string;
  toTime: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
}

const empty: FormState = {
  name: '',
  vehicleType: '',
  type: 'regular',
  hourlyRate: '',
  fromTime: '00:00',
  toTime: '23:59',
  effectiveFrom: '',
  effectiveTo: '',
  isActive: true,
};

const toDateInput = (v?: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

const TYPE_LABEL: Record<PricingType, string> = {
  regular: 'Regular',
  peak: 'Peak',
};

export function ManagerPricingPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<PricePolicy[]>([]);
  const [vts, setVts] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PricePolicy | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, vtList] = await Promise.all([
        managerApi.pricePolicies.list(buildingId),
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

  const openEdit = (row: PricePolicy) => {
    setEditing(row);
    setForm({
      name: row.name,
      vehicleType: typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType._id,
      type: row.type === 'peak' ? 'peak' : 'regular',
      hourlyRate: String(row.hourlyRate),
      fromTime: row.timeWindow?.from ?? '00:00',
      toTime: row.timeWindow?.to ?? '23:59',
      effectiveFrom: toDateInput(row.effectiveFrom),
      effectiveTo: toDateInput(row.effectiveTo),
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
      name: form.name.trim(),
      vehicleType: form.vehicleType,
      type: form.type,
      hourlyRate: Number(form.hourlyRate),
      timeWindow: { from: form.fromTime, to: form.toTime },
      ...(form.effectiveFrom ? { effectiveFrom: form.effectiveFrom } : {}),
      effectiveTo: form.effectiveTo ? form.effectiveTo : null,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await managerApi.pricePolicies.update(buildingId, editing._id, payload);
      } else {
        await managerApi.pricePolicies.create(buildingId, payload);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  // Xác nhận qua ConfirmModal (bỏ window.confirm native).
  const [deleteTarget, setDeleteTarget] = useState<PricePolicy | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deactivate = (row: PricePolicy) => setDeleteTarget(row);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await managerApi.pricePolicies.deactivate(buildingId, deleteTarget._id);
      showToast('Policy disabled', 'success');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataColumn<PricePolicy>[] = [
    { key: 'name', title: 'Policy name' },
    {
      key: 'vehicleType',
      title: 'Vehicle type',
      render: (row) => (typeof row.vehicleType === 'string' ? row.vehicleType : row.vehicleType.code),
    },
    {
      key: 'type',
      title: 'Price type',
      render: (row) => TYPE_LABEL[(row.type === 'peak' ? 'peak' : 'regular') as PricingType],
    },
    {
      key: 'hourlyRate',
      title: 'Price/hour',
      render: (row) => `${row.hourlyRate.toLocaleString('vi-VN')} đ`,
    },
    {
      key: 'timeWindow',
      title: 'Time window',
      render: (row) =>
        row.timeWindow ? `${row.timeWindow.from} – ${row.timeWindow.to}` : '—',
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
          <Button size="sm" variant="ghost" onClick={() => deactivate(row)}>
            <PowerOff size={14} />
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
              Billing & Pricing
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Banknote size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
              Price Policies
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Manage hourly rates, peak hours, and custom vehicle tariff rules.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold p-8 justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
          <span>Loading pricing policies...</span>
        </div>
      ) : error ? (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{error}</p>
      ) : (
        <DataTable
          title="Price policies"
          rows={items}
          columns={columns}
          rightElement={
            <Button
              onClick={openCreate}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5"
            >
              <Plus size={14} className="stroke-[2.5]" /> Create price policy
            </Button>
          }
        />
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit price policy' : 'Create price policy'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-xs uppercase text-muted-foreground">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Vehicle type</label>
            <CustomSelect
              value={form.vehicleType}
              onChange={(val) => setForm((f) => ({ ...f, vehicleType: val }))}
              options={[
                { value: '', label: 'Select vehicle type' },
                ...vts.map((vt) => ({
                  value: vt._id,
                  label: `${vt.code} - ${vt.name}`,
                })),
              ]}
              placeholder="Select vehicle type..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Price type</label>
            <CustomSelect
              value={form.type}
              onChange={(val) => setForm((f) => ({ ...f, type: val as PricingType }))}
              options={[
                { value: 'regular', label: 'Regular' },
                { value: 'peak', label: 'Peak' },
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Price/hour (VND)</label>
            <Input
              type="number"
              min={0}
              value={form.hourlyRate}
              onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">From</label>
            <TimePicker
              value={form.fromTime}
              onChange={(val) => setForm((f) => ({ ...f, fromTime: val }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">To</label>
            <TimePicker
              value={form.toTime}
              onChange={(val) => setForm((f) => ({ ...f, toTime: val }))}
            />
          </div>
          <p className="md:col-span-2 text-[11px] text-muted-foreground">
            “Regular” applies by default; “Peak” applies within the From–To window. Fee = total parked hours × price/hour of the window.
          </p>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Effective from</label>
            <DatePicker
              value={form.effectiveFrom}
              onChange={(val) => setForm((f) => ({ ...f, effectiveFrom: val }))}
            />
            <p className="text-[11px] text-muted-foreground">Leave empty = effective now.</p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Effective until</label>
            <DatePicker
              value={form.effectiveTo}
              onChange={(val) => setForm((f) => ({ ...f, effectiveTo: val }))}
            />
            <p className="text-[11px] text-muted-foreground">Leave empty = no limit.</p>
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span>Active</span>
          </label>
        </div>
      </ModalForm>
    <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Disable price policy"
        description={`Disable policy "${deleteTarget?.name}"?`}
        confirmLabel="Disable"
        onConfirm={confirmDelete}
        isConfirming={deleting}
      />
    </div>
  );
}
