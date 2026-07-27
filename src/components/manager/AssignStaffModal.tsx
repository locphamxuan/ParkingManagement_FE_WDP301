import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { managerApi, type StaffShift } from '@/services/manager/managerApi';
import { CustomSelect } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    staff: string;
    shift: string;
    workDate: string;
    gate?: string | null;
    note?: string;
  }) => Promise<void>;
  buildingId: string;
  editingData?: StaffShift | null;
  isSubmitting?: boolean;
}

interface Staff {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface Shift {
  _id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
}

export function AssignStaffModal({
  isOpen,
  onClose,
  onSubmit,
  buildingId,
  editingData,
  isSubmitting = false,
}: AssignStaffModalProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [shiftList, setShiftList] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [workDate, setWorkDate] = useState('');

  // Load staff and shifts on mount
  useEffect(() => {
    if (!isOpen || !buildingId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      managerApi.shifts.listStaff(buildingId),
      managerApi.shifts.list(buildingId),
    ])
      .then(([staffRes, shiftsRes]) => {
        setStaffList(staffRes.data.items);
        setShiftList(shiftsRes.data.items);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      })
      .finally(() => setLoading(false));
  }, [isOpen, buildingId]);

  // Populate form when editing
  useEffect(() => {
    if (editingData) {
      setSelectedStaff(editingData.staff._id);
      setSelectedShift(editingData.shift._id);
      setWorkDate(editingData.workDate);
    } else {
      // Reset form for creating new
      setSelectedStaff('');
      setSelectedShift('');
      setWorkDate('');
    }
  }, [editingData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedStaff) {
      setError('Please select a staff member');
      return;
    }
    if (!selectedShift) {
      setError('Please select a shift');
      return;
    }
    if (!workDate) {
      setError('Please select a work date');
      return;
    }

    try {
      await onSubmit({
        staff: selectedStaff,
        shift: selectedShift,
        workDate,
        gate: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error while saving');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title={editingData ? 'Edit shift assignment' : 'Assign staff to shift'}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin mr-2" size={20} />
          <span className="text-sm text-muted-foreground">Loading data...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4 max-h-[68vh] overflow-y-auto pr-1 pb-2 custom-scrollbar">
          {/* Staff Selection */}
          <div className="grid gap-2">
            <label className="text-xs uppercase text-slate-500 font-bold tracking-wider font-mono">Staff<span className="text-red-500">*</span></label>
            <CustomSelect
              value={selectedStaff}
              onChange={setSelectedStaff}
              disabled={isSubmitting}
              options={[
                { value: '', label: '-- Select staff --' },
                ...staffList.map((staff) => ({
                  value: staff._id,
                  label: `${staff.fullName} (${staff.email})`,
                })),
              ]}
              placeholder="-- Select staff --"
              className="h-10 text-sm font-semibold"
            />
          </div>

          {/* Shift Selection */}
          <div className="grid gap-2">
            <label className="text-xs uppercase text-slate-500 font-bold tracking-wider font-mono">Shift<span className="text-red-500">*</span></label>
            <CustomSelect
              value={selectedShift}
              onChange={setSelectedShift}
              disabled={isSubmitting}
              options={[
                { value: '', label: '-- Select shift --' },
                ...shiftList.map((shift) => ({
                  value: shift._id,
                  label: `${shift.code} — ${shift.name} (${shift.startTime}–${shift.endTime})`,
                })),
              ]}
              placeholder="-- Select shift --"
              className="h-10 text-sm font-semibold"
            />
          </div>

          {/* Work Date */}
          <div className="grid gap-2">
            <label className="text-xs uppercase text-slate-500 font-bold tracking-wider font-mono">Work date<span className="text-red-500">*</span></label>
            <DatePicker
              value={workDate}
              onChange={setWorkDate}
              disabled={isSubmitting}
              className="h-10 text-sm font-semibold"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-sky-100/50 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl text-xs font-bold"
            >Cancel</Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 gap-2 rounded-xl text-xs font-bold"
            >
              {isSubmitting && <Loader size={14} className="animate-spin" />}
              {isSubmitting
                ? 'Saving...'
                : editingData
                  ? 'Update'
                  : 'Assign staff'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
