import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, PowerOff, AlertTriangle, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ModalForm } from '@/components/shared/ModalForm';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type PricePolicy, type VehicleType } from '@/services/manager/managerApi';

type PricingType = 'regular' | 'peak';

interface FormState {
  name: string;
  vehicleType: string;
  type: PricingType;
  hourlyRate: string;
  fromTime: string;
  toTime: string;
  isActive: boolean;
}

const empty: FormState = {
  name: '',
  vehicleType: '',
  type: 'regular',
  hourlyRate: '',
  fromTime: '07:00',
  toTime: '09:00',
  isActive: true,
};

// Safe vehicleType display helper — guards against null/undefined
const vtDisplay = (vt: VehicleType | string | null | undefined): string => {
  if (!vt) return '—';
  if (typeof vt === 'string') return vt;
  return vt.code ? `${vt.code} · ${vt.name}` : vt.name ?? '—';
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmItem, setConfirmItem] = useState<PricePolicy | null>(null);
  const [confirming, setConfirming] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, vtList] = await Promise.all([
        managerApi.pricePolicies.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      // The API returns { data: { items: [...] } }
      setItems((list as any)?.data?.items ?? []);
      setVts((vtList as any)?.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { refresh(); }, [refresh]);

  // ── Modal open helpers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, vehicleType: vts[0]?._id ?? '' });
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEdit = (row: PricePolicy) => {
    setEditing(row);
    // Guard against null vehicleType
    const vtId =
      !row.vehicleType
        ? ''
        : typeof row.vehicleType === 'string'
          ? row.vehicleType
          : row.vehicleType._id ?? '';
    setForm({
      name: row.name,
      vehicleType: vtId,
      type: (row.type === 'peak' ? 'peak' : 'regular'),
      hourlyRate: String(row.hourlyRate),
      fromTime: row.timeWindow?.from ?? '07:00',
      toTime: row.timeWindow?.to ?? '09:00',
      isActive: row.isActive,
    });
    setSubmitError(null);
    setModalOpen(true);
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const onSubmit = async () => {
    if (!form.vehicleType) {
      setSubmitError('Please select a vehicle type.');
      return;
    }
    if (!form.hourlyRate || isNaN(Number(form.hourlyRate)) || Number(form.hourlyRate) < 0) {
      setSubmitError('Invalid hourly rate.');
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        vehicleType: form.vehicleType,
        type: form.type,
        hourlyRate: Number(form.hourlyRate),
        isActive: form.isActive,
      };
      if (form.type === 'peak') {
        payload.timeWindow = { from: form.fromTime, to: form.toTime };
      }
      if (editing) {
        await managerApi.pricePolicies.update(buildingId, editing._id, payload as Partial<PricePolicy>);
      } else {
        await managerApi.pricePolicies.create(buildingId, payload as Partial<PricePolicy>);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Deactivate ────────────────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!confirmItem) return;
    setConfirming(true);
    try {
      await managerApi.pricePolicies.deactivate(buildingId, confirmItem._id);
      setConfirmItem(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate');
      setConfirmItem(null);
    } finally {
      setConfirming(false);
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────────
  const columns: DataColumn<PricePolicy>[] = [
    {
      key: 'name',
      title: 'Policy Name',
      render: (row) => <span className="font-semibold text-white">{row.name}</span>,
    },
    {
      key: 'vehicleType',
      title: 'Vehicle Type',
      render: (row) => (
        <span className="text-slate-300">{vtDisplay(row.vehicleType)}</span>
      ),
    },
    {
      key: 'type',
      title: 'Rate Type',
      render: (row) =>
        row.type === 'peak' ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400">
            <Zap size={10} /> Peak
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
            <Clock size={10} /> Regular
          </span>
        ),
    },
    {
      key: 'hourlyRate',
      title: 'Rate/hour',
      render: (row) => (
        <span className="font-mono font-bold text-orange-400">
          {row.hourlyRate.toLocaleString('en-US')} ₫
        </span>
      ),
    },
    {
      key: 'timeWindow',
      title: 'Time Window',
      render: (row) =>
        row.type === 'peak' && row.timeWindow ? (
          <span className="text-xs text-amber-300">
            {row.timeWindow.from} – {row.timeWindow.to}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
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
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)} title="Edit">
            <Pencil size={14} />
          </Button>
          {row.isActive && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmItem(row)}
              title="Deactivate"
            >
              <PowerOff size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Pricing Policies</h2>
          <p className="text-xs text-muted-foreground">
            Configure regular and peak-hour rates for each vehicle type.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus size={14} /> Create Policy
        </Button>
      </div>

      {/* Error banner */}
      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertTriangle size={14} className="shrink-0" />
          {error}
        </div>
      ) : null}

      {/* Table */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <DataTable title="Pricing Policies" rows={items} columns={columns} />
      )}

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Pricing Policy' : 'Create Pricing Policy'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-4">

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Policy Name
            </label>
            <Input
              placeholder="E.g. Morning peak rate"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vehicle Type
              </label>
              <select
                className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                value={form.vehicleType}
                onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}
              >
                <option value="">-- Select vehicle type --</option>
                {vts.map((vt) => (
                  <option key={vt._id} value={vt._id}>
                    {vt.code} - {vt.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Rate / hour (VND)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="E.g. 5000"
                value={form.hourlyRate}
                onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rate Type
            </label>
            <div className="flex gap-3">
              {(['regular', 'peak'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition-colors
                    ${form.type === t
                      ? t === 'peak'
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                        : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-border bg-card text-muted-foreground hover:border-white/20'
                    }`}
                >
                  {t === 'peak' ? <Zap size={14} /> : <Clock size={14} />}
                  {t === 'peak' ? 'Peak Hours' : 'Regular Hours'}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'peak' && (
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <div className="grid gap-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  <Clock size={11} /> From
                </label>
                <Input
                  type="time"
                  value={form.fromTime}
                  onChange={(e) => setForm((f) => ({ ...f, fromTime: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  <Clock size={11} /> To
                </label>
                <Input
                  type="time"
                  value={form.toTime}
                  onChange={(e) => setForm((f) => ({ ...f, toTime: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Active */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span className="text-muted-foreground">Active immediately</span>
          </label>

          {/* Submit error */}
          {submitError ? (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">
              <AlertTriangle size={13} className="shrink-0" />
              {submitError}
            </div>
          ) : null}
        </div>
      </ModalForm>

      {/* ── Confirm Deactivate Modal ────────────────────────────────────────── */}
      <ConfirmModal
        open={!!confirmItem}
        title="Deactivate Pricing Policy"
        description={`Are you sure you want to deactivate policy "${confirmItem?.name}"? This does not delete data — you can re-activate by creating a new policy.`}
        confirmLabel="Deactivate"
        onOpenChange={(open) => { if (!open) setConfirmItem(null); }}
        onConfirm={handleDeactivate}
        isConfirming={confirming}
      />
    </div>
  );
}
