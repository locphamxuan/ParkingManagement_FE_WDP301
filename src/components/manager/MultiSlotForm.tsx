import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CustomSelect } from '@/components/ui/select';
import { ZONE_USAGE_LABELS, type Floor, type Zone } from '@/services/manager/managerApi';

/** Body gửi POST /slots/batch — BE tự sinh mã nối tiếp theo code zone ({zone}-01, -02…). */
export interface SlotBatchInput {
  floor: string;
  zone: string;
  quantity: number;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  reservable?: boolean;
  note?: string;
}

interface MultiSlotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: SlotBatchInput) => Promise<void>;
  floors: Floor[];
  zones: Zone[];
}

const MAX_BATCH = 50;

const zoneFloorId = (z: Zone) => (typeof z.floor === 'string' ? z.floor : z.floor._id);

export function MultiSlotForm({ isOpen, onClose, onSubmit, floors, zones }: MultiSlotFormProps) {
  const [floor, setFloor] = useState('');
  const [zone, setZone] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [status, setStatus] = useState<SlotBatchInput['status']>('available');
  const [reservable, setReservable] = useState(true);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const floorZones = useMemo(
    () => zones.filter((z) => zoneFloorId(z) === floor),
    [zones, floor]
  );
  const selectedZone = floorZones.find((z) => z._id === zone);
  const zoneRemaining = selectedZone
    ? Math.max(0, (selectedZone.capacity ?? 0) - (selectedZone.slotCount ?? 0))
    : null;

  const reset = () => {
    setFloor('');
    setZone('');
    setQuantity('1');
    setStatus('available');
    setReservable(true);
    setNote('');
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const qty = Number(quantity);
    if (!floor) return setError('Please select a floor');
    if (!zone) return setError('Please select a zone');
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_BATCH) {
      return setError(`Quantity must be an integer between 1 and ${MAX_BATCH}`);
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ floor, zone, quantity: qty, status, reservable, note: note.trim() });
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add slots in batch"
      open={isOpen}
      onOpenChange={handleClose}
    >
      <div className="flex flex-col gap-4 max-h-[75vh] text-slate-800">
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-655 uppercase tracking-wide">Floor *</label>
              <CustomSelect
                value={floor}
                onChange={(val) => {
                  setFloor(val);
                  setZone('');
                }}
                options={[
                  { value: '', label: '-- Select floor --' },
                  ...floors.map((f) => ({ value: f._id, label: f.name ? `${f.code} — ${f.name}` : f.code })),
                ]}
                disabled={submitting || floors.length === 0}
                placeholder="-- Select floor --"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-655 uppercase tracking-wide">Zone *</label>
              <CustomSelect
                value={zone}
                onChange={setZone}
                options={[
                  { value: '', label: '-- Select zone --' },
                  ...floorZones.map((z) => {
                    const used = z.slotCount ?? 0;
                    const cap = z.capacity ?? 0;
                    const full = cap > 0 && used >= cap;
                    return {
                      value: z._id,
                      label: `${z.code} · ${ZONE_USAGE_LABELS[z.usageType]} · ${used}/${cap}${full ? ' (full)' : ''}`,
                    };
                  }),
                ]}
                disabled={submitting || !floor}
                placeholder="-- Select zone --"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-655 uppercase tracking-wide">Quantity *</label>
              <Input
                type="number"
                min={1}
                max={MAX_BATCH}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={submitting}
                className="h-10 rounded-xl"
              />
              {zoneRemaining != null && (
                <p className="text-[10px] font-bold text-slate-500 mt-0.5 leading-normal">
                  Zone {selectedZone?.code}: {zoneRemaining} slot(s) remaining in capacity.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-655 uppercase tracking-wide">Status</label>
              <CustomSelect
                value={status ?? 'available'}
                onChange={(val) => setStatus(val as SlotBatchInput['status'])}
                options={[
                  { value: 'available', label: 'Available' },
                  { value: 'maintenance', label: 'Maintenance' },
                ]}
                disabled={submitting}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={reservable}
              onChange={(e) => setReservable(e.target.checked)}
              disabled={submitting}
              className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
            />
            <span>Allow advance reservation</span>
          </label>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-655 uppercase tracking-wide">Note</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Near stairs, special location"
              disabled={submitting}
              className="h-10 rounded-xl"
            />
          </div>
        </div>

        {/* Footer Area */}
        <div className="flex justify-end gap-2.5 border-t border-border pt-4 mt-1 shrink-0">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-xl px-5 py-2 font-bold text-xs transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl px-5 py-2 font-bold text-xs bg-primary text-primary-foreground hover:brightness-110 shadow-md shadow-primary/10 transition-all duration-200 hover:scale-[1.01]"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin mr-1.5" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={13} className="mr-1" />
                Create {Number(quantity) || 0} slot(s)
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
