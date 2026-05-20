import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ModalForm } from '@/components/shared/ModalForm';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Shift, type StaffShift } from '@/services/manager/managerApi';

interface StaffOption {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface FormState {
  staff: string;
  shift: string;
  workDate: string;
  note: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);
const empty: FormState = { staff: '', shift: '', workDate: todayStr(), note: '' };

export function ManagerStaffShiftsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<StaffShift[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, shiftList, staffList] = await Promise.all([
        managerApi.shifts.listStaffShifts(buildingId, {
          from: filterDate || undefined,
          to: filterDate || undefined,
        }),
        managerApi.shifts.list(buildingId),
        managerApi.shifts.listStaff(buildingId),
      ]);
      setItems(list.data.items);
      setShifts(shiftList.data.items);
      setStaff(staffList.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [buildingId, filterDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setForm({
      staff: staff[0]?._id ?? '',
      shift: shifts[0]?._id ?? '',
      workDate: todayStr(),
      note: '',
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!form.staff || !form.shift || !form.workDate) {
      alert('Cần chọn đầy đủ nhân viên / ca / ngày');
      return;
    }
    try {
      await managerApi.shifts.assignStaffShift(buildingId, {
        staff: form.staff,
        shift: form.shift,
        workDate: form.workDate,
        note: form.note.trim(),
      });
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const onDelete = async (row: StaffShift) => {
    if (!window.confirm(`Hủy phân ca ${row.shift?.code} ngày ${row.workDate.slice(0, 10)}?`)) return;
    try {
      await managerApi.shifts.removeStaffShift(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  const onStatusChange = async (row: StaffShift, status: StaffShift['status']) => {
    try {
      await managerApi.shifts.updateStaffShift(buildingId, row._id, { status });
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cập nhật thất bại');
    }
  };

  const columns: DataColumn<StaffShift>[] = [
    {
      key: 'workDate',
      title: 'Ngày',
      render: (row) => new Date(row.workDate).toLocaleDateString('vi-VN'),
    },
    {
      key: 'shift',
      title: 'Ca',
      render: (row) =>
        `${row.shift?.code ?? '?'} (${row.shift?.startTime ?? ''}–${row.shift?.endTime ?? ''})`,
    },
    { key: 'staff', title: 'Nhân viên', render: (row) => row.staff?.fullName ?? '?' },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <select
          className="h-8 rounded border border-border bg-card px-2 text-xs"
          value={row.status}
          onChange={(e) => onStatusChange(row, e.target.value as StaffShift['status'])}
        >
          {(['scheduled', 'active', 'completed', 'cancelled'] as const).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    { key: 'note', title: 'Ghi chú' },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <Button size="sm" variant="ghost" onClick={() => onDelete(row)}>
          <Trash2 size={14} />
        </Button>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="grid gap-1">
          <label className="text-xs uppercase text-muted-foreground">Lọc theo ngày</label>
          <input
            type="date"
            className="h-9 rounded-md border border-border bg-card px-3 text-sm"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        {filterDate ? (
          <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>
            Bỏ lọc
          </Button>
        ) : null}
        <div className="flex-1" />
        <Button onClick={openCreate} className="gap-2" disabled={shifts.length === 0 || staff.length === 0}>
          <Plus size={14} /> Phân ca
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title={`Phân ca (${items.length})`} rows={items} columns={columns} />
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Phân ca nhân viên"
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Nhân viên</label>
            <select
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={form.staff}
              onChange={(e) => setForm((f) => ({ ...f, staff: e.target.value }))}
            >
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.email})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Ca trực</label>
            <select
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={form.shift}
              onChange={(e) => setForm((f) => ({ ...f, shift: e.target.value }))}
            >
              {shifts.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} - {s.startTime}–{s.endTime}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Ngày làm</label>
            <Input
              type="date"
              value={form.workDate}
              onChange={(e) => setForm((f) => ({ ...f, workDate: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Ghi chú</label>
            <Input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>
      </ModalForm>
    </div>
  );
}
