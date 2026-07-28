import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type StaffShift } from '@/services/manager/managerApi';
import { AssignStaffModal } from '@/components/manager/AssignStaffModal';
import { showToast } from '@/components/common/ToastNotification';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

export function ManagerStaffShiftsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<StaffShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffShift | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(() => {
    if (!buildingId) return;
    
    setLoading(true);
    setError(null);
    
    managerApi.shifts
      .listStaffShifts(buildingId)
      .then((res) => setItems(res.data.items))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Load failed';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: StaffShift) => {
    setEditing(row);
    setModalOpen(true);
  };

  const onSubmit = async (data: {
    staff: string;
    shift: string;
    workDate: string;
    gate?: string | null;
    note?: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (editing) {
        await managerApi.shifts.updateStaffShift(buildingId, editing._id, {
          ...data,
        });
      } else {
        await managerApi.shifts.assignStaffShift(buildingId, data);
      }
      setModalOpen(false);
      setEditing(null);
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xác nhận qua ConfirmModal (bỏ window.confirm native).
  const [deleteTarget, setDeleteTarget] = useState<StaffShift | null>(null);
  const [deleting, setDeleting] = useState(false);
  const onDelete = (row: StaffShift) => setDeleteTarget(row);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await managerApi.shifts.removeStaffShift(buildingId, deleteTarget._id);
      showToast('Assignment deleted', 'success');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataColumn<StaffShift>[] = [
    {
      key: 'shift',
      title: 'Shift',
      render: (row) => (
        <div>
          <div className="font-medium">{row.shift?.code ?? '—'}</div>
          <div className="text-xs text-muted-foreground">
            {row.shift ? `${row.shift.startTime}–${row.shift.endTime}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'staff',
      title: 'Staff',
      render: (row) =>
        row.staff ? (
          <div>
            <div className="font-medium">{row.staff.fullName}</div>
            <div className="text-xs text-muted-foreground">{row.staff.email}</div>
          </div>
        ) : (
          <span className="text-xs italic text-muted-foreground">Staff deleted</span>
        ),
    },
    {
      key: 'gate',
      title: 'Gate',
      render: (row) =>
        row.gate ? (
          <div>
            <div className="font-medium">{row.gate.code}</div>
            <div className="text-xs text-muted-foreground">
              {row.gate.direction === 'in' ? 'Entry gate' : row.gate.direction === 'out' ? 'Exit gate' : 'Two-way'}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'workDate',
      title: 'Work date',
      render: (row) => new Date(row.workDate).toLocaleDateString('vi-VN'),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'note',
      title: 'Notes',
      render: (row) => row.note ? <span className="text-sm">{row.note}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => openEdit(row)}
            disabled={isSubmitting}
          >
            <Pencil size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(row)}
            disabled={isSubmitting}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold p-8 justify-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <Loader2 className="animate-spin mr-2" size={16} />
          <span>Loading shift configurations...</span>
        </div>
      ) : error ? (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{error}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-800 shadow-sm flex flex-col items-center justify-center">
          <p className="text-slate-500 font-semibold mb-4 text-xs">No staff members assigned to shifts yet.</p>
          <Button onClick={openCreate} className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all duration-200 active:scale-[0.98]">
            <Plus size={14} className="stroke-[2.5] mr-1.5" /> Assign first staff
          </Button>
        </div>
      ) : (
        <DataTable
          title="Shift assignments"
          rows={items}
          columns={columns}
          rightElement={
            <Button
              onClick={openCreate}
              disabled={loading}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5"
            >
              <Plus size={14} className="stroke-[2.5]" /> Assign staff
            </Button>
          }
        />
      )}

      <AssignStaffModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={onSubmit}
        buildingId={buildingId}
        editingData={editing}
        isSubmitting={isSubmitting}
      />
    <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete shift assignment"
        description={`Delete assignment for ${deleteTarget?.staff?.fullName ?? 'this staff'}?`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        isConfirming={deleting}
      />
    </div>
  );
}
