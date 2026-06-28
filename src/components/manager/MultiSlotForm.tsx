import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CustomSelect } from '@/components/ui/select';
import type { Floor } from '@/services/manager/managerApi';

export interface SlotFormRow {
  id: string;
  code: string;
  floor: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  reservable: boolean;
  note: string;
}

interface MultiSlotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rows: SlotFormRow[]) => Promise<void>;
  floors: Floor[];
  loading?: boolean;
}

const emptyRow = (): SlotFormRow => ({
  id: Math.random().toString(36),
  code: '',
  floor: '',
  status: 'available',
  reservable: true,
  note: '',
});

export function MultiSlotForm({ isOpen, onClose, onSubmit, floors }: MultiSlotFormProps) {
  const [rows, setRows] = useState<SlotFormRow[]>([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddRow = () => {
    setRows([...rows, emptyRow()]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const handleRowChange = (id: string, field: keyof SlotFormRow, value: unknown) => {
    setRows(
      rows.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSubmit = async () => {
    // Validation
    for (const row of rows) {
      if (!row.code.trim()) {
        setError('Slot code cannot be empty');
        return;
      }
      if (!row.floor) {
        setError('A floor must be selected for each slot');
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(rows);
      setRows([emptyRow()]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRows([emptyRow()]);
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card px-6 py-4 flex items-center justify-between backdrop-blur-md">
          <div>
            <h2 className="text-lg font-bold text-foreground">Add new slots</h2>
            <p className="text-xs text-muted-foreground mt-1">Create one or more slots at once</p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-foreground">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Slots List */}
          <div className="space-y-3 max-h-[calc(90vh-300px)] overflow-y-auto">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="rounded-xl border border-sky-100 bg-sky-50/10 p-4 space-y-3 hover:border-sky-200 transition-colors"
              >
                {/* Slot Number */}
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-sky-50 border border-sky-100 text-sky-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                    Slot #{index + 1}
                  </span>
                  {rows.length > 1 && (
                    <button
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={submitting}
                      className="text-muted-foreground hover:text-rose-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {/* Row Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Slot code */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Slot code *</label>
                    <Input
                      value={row.code}
                      onChange={(e) => handleRowChange(row.id, 'code', e.target.value.toUpperCase())}
                      placeholder="e.g. A01, B12"
                      disabled={submitting}
                      className="text-sm"
                    />
                  </div>

                  {/* Floor */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Floor *</label>
                    <CustomSelect
                      value={row.floor}
                      onChange={(val) => handleRowChange(row.id, 'floor', val)}
                      options={[
                        { value: '', label: '-- Select floor --' },
                        ...floors.map((f) => ({
                          value: f._id,
                          label: f.code,
                        })),
                      ]}
                      disabled={submitting || floors.length === 0}
                      placeholder="-- Select floor --"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
                    <CustomSelect
                      value={row.status}
                      onChange={(val) => handleRowChange(row.id, 'status', val)}
                      options={[
                        { value: 'available', label: 'Available' },
                        { value: 'occupied', label: 'Full' },
                        { value: 'reserved', label: 'Reservation' },
                        { value: 'maintenance', label: 'Maintenance' },
                      ]}
                      disabled={submitting}
                    />
                  </div>

                  {/* Reservable */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reservable</label>
                    <CustomSelect
                      value={row.reservable ? 'yes' : 'no'}
                      onChange={(val) => handleRowChange(row.id, 'reservable', val === 'yes')}
                      options={[
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' },
                      ]}
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note</label>
                  <Input
                    value={row.note}
                    onChange={(e) => handleRowChange(row.id, 'note', e.target.value)}
                    placeholder="e.g. Near stairs, special location"
                    disabled={submitting}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add More Button */}
          <button
            onClick={handleAddRow}
            disabled={submitting}
            className="w-full rounded-xl border-2 border-dashed border-sky-200 hover:border-sky-400 py-3 text-sky-600 hover:text-sky-700 bg-sky-50/20 hover:bg-sky-50/50 font-semibold text-sm uppercase tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center gap-2 group"
          >
            <Plus size={18} className="group-hover:scale-110 transition-transform" />Add another slot</button>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 border-t border-border bg-card px-6 py-4 flex gap-3 justify-end backdrop-blur-md">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="text-sm"
          >Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || rows.length === 0}
            className="bg-primary hover:brightness-110 text-primary-foreground font-semibold text-sm gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />Saving...</>
            ) : (
              <>
                <Plus size={16} />
                Create {rows.length} slots
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
