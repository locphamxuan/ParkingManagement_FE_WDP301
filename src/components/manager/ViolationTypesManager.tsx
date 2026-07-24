import { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { managerApi, type ViolationType } from '@/services/manager/managerApi';
import { resolveErrorMessage } from '@/utils/apiErrors';

const fmtMoney = (n: number) => n.toLocaleString('en-US');

interface EditableRowProps {
  item: ViolationType;
  onSave: (label: string, fee: number) => Promise<void>;
  onRequestDelete: () => void;
}

function ViolationTypeRow({ item, onSave, onRequestDelete }: EditableRowProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [fee, setFee] = useState(String(item.fee));
  const [saving, setSaving] = useState(false);

  const cancel = () => {
    setLabel(item.label);
    setFee(String(item.fee));
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(label.trim(), Number(fee));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/40 p-3">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 flex-1 bg-white text-sm font-semibold" />
        <Input
          type="number"
          min="0"
          step="10000"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          className="h-9 w-32 bg-white text-sm font-bold"
        />
        <Button type="button" size="sm" onClick={save} disabled={saving || !label.trim()} className="h-9 px-3">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={cancel} disabled={saving} className="h-9 px-3">
          <X size={14} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">{item.label}</p>
        <p className="font-mono text-[10px] text-slate-400">{item.code}</p>
      </div>
      <p className="shrink-0 font-mono text-sm font-black text-rose-700">{fmtMoney(item.fee)} VND</p>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)} className="h-8 px-2.5 text-xs">
          Edit
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onRequestDelete} className="h-8 px-2.5 text-rose-600 hover:bg-rose-50">
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

/**
 * Bảng giá phạt vi phạm — manager tự thêm/sửa/xoá (không hard code trong code).
 * Khi manager duyệt phạt cho 1 incident có type khớp code ở đây, phí bị áp ĐÚNG
 * giá trị đã cấu hình — không còn cho nhập tay tuỳ ý (tránh set phí quá cao).
 * Chỉ incident type='other' vẫn cho phép nhập tay lúc duyệt.
 */
export function ViolationTypesManager({ buildingId }: { buildingId: string }) {
  const [items, setItems] = useState<ViolationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newLabel, setNewLabel] = useState('');
  const [newFee, setNewFee] = useState('');
  const [creating, setCreating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ViolationType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await managerApi.violationTypes.list(buildingId);
      setItems(res.data.items ?? []);
    } catch (err) {
      setError(resolveErrorMessage(err, 'Failed to load violation types.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId]);

  const handleCreate = async () => {
    if (!newLabel.trim() || newFee === '') return;
    setCreating(true);
    setError(null);
    try {
      await managerApi.violationTypes.create(buildingId, { label: newLabel.trim(), fee: Number(newFee) });
      setNewLabel('');
      setNewFee('');
      await refresh();
    } catch (err) {
      setError(resolveErrorMessage(err, 'Failed to create violation type.'));
    } finally {
      setCreating(false);
    }
  };

  const handleSaveRow = async (item: ViolationType, label: string, fee: number) => {
    try {
      await managerApi.violationTypes.update(buildingId, item._id, { label, fee });
      await refresh();
    } catch (err) {
      setError(resolveErrorMessage(err, 'Failed to update violation type.'));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await managerApi.violationTypes.remove(buildingId, deleteTarget._id);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      setError(resolveErrorMessage(err, 'Failed to delete violation type.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 space-y-4">
      <div>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-2">
          ⚖️ Violation Penalty Price List
        </h3>
        <p className="mt-1 text-[10px] text-slate-500 font-medium">
          Each violation type has its own fixed fee — when a penalty is approved for a classified
          incident, this exact amount is charged (no manual override). Only "Other" incidents
          (not matching any type here) let you enter a custom amount when resolving.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[11px] font-bold text-rose-700">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-xs font-semibold text-slate-500">
          <Loader2 size={14} className="animate-spin" /> Loading...
        </div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs font-semibold text-slate-400">
              No violation types configured yet — add one below.
            </p>
          ) : (
            items.map((item) => (
              <ViolationTypeRow
                key={item._id}
                item={item}
                onSave={(label, fee) => handleSaveRow(item, label, fee)}
                onRequestDelete={() => setDeleteTarget(item)}
              />
            ))
          )}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-dashed border-rose-300 bg-white/60 p-3">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="New violation type (e.g. Parked across two slots)"
          className="h-9 flex-1 bg-white text-sm"
        />
        <Input
          type="number"
          min="0"
          step="10000"
          value={newFee}
          onChange={(e) => setNewFee(e.target.value)}
          placeholder="Fee (VND)"
          className="h-9 w-32 bg-white text-sm"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleCreate}
          disabled={creating || !newLabel.trim() || newFee === ''}
          className="h-9 px-3"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        </Button>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete violation type?"
        description={`"${deleteTarget?.label}" will no longer be selectable when users report an incident. This does not affect incidents already reported.`}
        confirmLabel="Delete"
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        isConfirming={deleting}
      />
    </div>
  );
}
