import { useCallback, useEffect, useState } from 'react';
import { ArrowRightLeft, LogIn, LogOut, Plus, Pencil, Trash2, X, Loader2, DoorOpen, CheckCircle2 } from 'lucide-react';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Gate } from '@/services/manager/managerApi';
import { showToast } from '@/components/common/ToastNotification';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

const directionLabel: Record<Gate['direction'], string> = {
  in: 'Entry gate',
  out: 'Exit gate',
  both: 'Two-way',
};

const directionIcon: Record<Gate['direction'], React.ReactNode> = {
  in: <LogIn size={14} className="text-emerald-400" />,
  out: <LogOut size={14} className="text-rose-400" />,
  both: <ArrowRightLeft size={14} className="text-blue-400" />,
};

const GATE_STATUSES: Gate['status'][] = ['active', 'inactive', 'maintenance'];
const statusLabel: Record<Gate['status'], string> = {
  active: 'Active',
  inactive: 'Paused',
  maintenance: 'Maintenance',
};

interface GateForm {
  code: string;
  name: string;
  direction: Gate['direction'];
  status: Gate['status'];
}

const emptyForm: GateForm = { code: '', name: '', direction: 'in', status: 'active' };

export function ManagerGatesPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Gate | null>(null);
  const [form, setForm] = useState<GateForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const gates = await managerApi.gates.list(buildingId);
      setItems(gates.data.items);
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
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: Gate) => {
    setEditing(row);
    setForm({ code: row.code, name: row.name || '', direction: row.direction, status: row.status });
    setFormError(null);
    setModalOpen(true);
  };

  const onStatusChange = async (row: Gate, status: Gate['status']) => {
    setSavingId(row._id);
    setItems((prev) => prev.map((g) => (g._id === row._id ? { ...g, status } : g)));
    try {
      await managerApi.gates.updateStatus(buildingId, row._id, status);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
      refresh();
    } finally {
      setSavingId(null);
    }
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setFormError(null);
    if (!form.code.trim()) {
      setFormError('Please enter a gate code');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        direction: form.direction,
        status: form.status,
      };
      if (editing) {
        await managerApi.gates.update(buildingId, editing._id, body);
      } else {
        await managerApi.gates.create(buildingId, body);
      }
      setModalOpen(false);
      setEditing(null);
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Xác nhận qua ConfirmModal (bỏ window.confirm native).
  const [deleteTarget, setDeleteTarget] = useState<Gate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const onDelete = (row: Gate) => setDeleteTarget(row);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await managerApi.gates.remove(buildingId, deleteTarget._id);
      showToast('Gate deleted', 'success');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataColumn<Gate>[] = [
    { key: 'code', title: 'Code' },
    { key: 'name', title: 'Name', render: (row) => row.name || '—' },
    {
      key: 'direction',
      title: 'Gate type',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          {directionIcon[row.direction]} {directionLabel[row.direction]}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => (
        <CustomSelect
          value={row.status}
          disabled={savingId === row._id}
          onChange={(val) => onStatusChange(row, val as Gate['status'])}
          options={GATE_STATUSES.map((s) => ({
            value: s,
            label: statusLabel[s],
          }))}
          className="h-8 w-28 text-xs font-semibold"
        />
      ),
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

  const totalGates = items.length;
  const entryGates = items.filter((x) => x.direction === 'in' || x.direction === 'both').length;
  const exitGates = items.filter((x) => x.direction === 'out' || x.direction === 'both').length;
  const activeGates = items.filter((x) => x.status === 'active').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
              Facility Gates
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <DoorOpen size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
              Gates & Gateways
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Create gates and choose direction types: entry, exit, or two-way.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              onClick={openCreate}
              disabled={loading}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Plus size={14} className="stroke-[3] mr-1.5" /> Add gate
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Low-Profile Summary Row (API Data Powered) */}
      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Total Gateways', val: `${totalGates} gates`, icon: DoorOpen, borderLeft: 'border-l-blue-500', color: 'text-blue-655 bg-blue-50/50 border-blue-105' },
            { label: 'Entry Points', val: `${entryGates} lanes`, icon: LogIn, borderLeft: 'border-l-emerald-500', color: 'text-emerald-655 bg-emerald-50/50 border-emerald-105' },
            { label: 'Exit Points', val: `${exitGates} lanes`, icon: LogOut, borderLeft: 'border-l-rose-500', color: 'text-rose-655 bg-rose-50/50 border-rose-105' },
            { label: 'Active Status', val: `${activeGates} active`, icon: CheckCircle2, borderLeft: 'border-l-indigo-500', color: 'text-indigo-655 bg-indigo-50/50 border-indigo-105' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`rounded-2xl border border-slate-200/80 border-l-4 ${stat.borderLeft} bg-white p-4 shadow-sm hover:scale-[1.01] hover:shadow-md transition-all duration-300 flex items-center justify-between group select-none`}>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">{stat.label}</p>
                  <p className="mt-1.5 text-base font-black text-slate-800 font-mono group-hover:text-blue-755 transition-colors">{stat.val}</p>
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
        <div className="flex items-center gap-2 text-slate-650 text-xs font-bold p-8 justify-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <Loader2 className="animate-spin mr-2" size={16} />
          <span>Loading gate configurations...</span>
        </div>
      ) : error ? (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-xs font-bold text-slate-500 italic shadow-sm">
          No gates configured yet. Tap “Add gate” to create one.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <DataTable title="Gates" rows={items} columns={columns} />
        </div>
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit gate' : 'Add gate'}
        onSubmit={() => onSubmit()}
      >
        <div className="grid gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Gate code <span className="text-red-500">*</span></label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="VD: IN, OUT, G1"
              disabled={submitting}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Gate name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Main entry gate"
              disabled={submitting}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Gate type <span className="text-red-500">*</span></label>
            <CustomSelect
              value={form.direction}
              onChange={(val) => setForm((f) => ({ ...f, direction: val as Gate['direction'] }))}
              options={[
                { value: 'in', label: 'Entry gate' },
                { value: 'out', label: 'Exit gate' },
                { value: 'both', label: 'Two-way' },
              ]}
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Status</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as Gate['status'] }))}
              options={GATE_STATUSES.map((s) => ({
                value: s,
                label: statusLabel[s],
              }))}
              disabled={submitting}
            />
          </div>

          {formError && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-650 border border-red-200 mt-2">{formError}</div>
          )}
        </div>
      </ModalForm>
    <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete gate"
        description={`Delete gate ${deleteTarget?.code}?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        isConfirming={deleting}
      />
    </div>
  );
}
