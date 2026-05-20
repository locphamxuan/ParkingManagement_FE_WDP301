import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ModalForm } from '@/components/shared/ModalForm';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  type Floor,
  type ParkingSlot,
  type VehicleType,
} from '@/services/manager/managerApi';

interface FormState {
  code: string;
  floor: string;
  vehicleType: string;
  status: ParkingSlot['status'];
  reservable: boolean;
  note: string;
}

const empty: FormState = {
  code: '',
  floor: '',
  vehicleType: '',
  status: 'available',
  reservable: true,
  note: '',
};

const SLOT_STATUSES: ParkingSlot['status'][] = ['available', 'occupied', 'reserved', 'maintenance'];

export function ManagerSlotsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<ParkingSlot[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [floorFilter, setFloorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ParkingSlot | null>(null);
  const [form, setForm] = useState<FormState>(empty);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, floorsRes, vtRes] = await Promise.all([
        managerApi.slots.list(buildingId, {
          floor: floorFilter || undefined,
          status: statusFilter || undefined,
        }),
        managerApi.floors.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      setItems(slotsRes.data.items);
      setFloors(floorsRes.data.items);
      setVehicleTypes(vtRes.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [buildingId, floorFilter, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const floorMap = useMemo(() => {
    const map = new Map<string, Floor>();
    floors.forEach((f) => map.set(f._id, f));
    return map;
  }, [floors]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, floor: floors[0]?._id ?? '' });
    setModalOpen(true);
  };

  const openEdit = (row: ParkingSlot) => {
    const floorId = typeof row.floor === 'string' ? row.floor : row.floor._id;
    const vtId = !row.vehicleType
      ? ''
      : typeof row.vehicleType === 'string'
        ? row.vehicleType
        : row.vehicleType._id;
    setEditing(row);
    setForm({
      code: row.code,
      floor: floorId,
      vehicleType: vtId,
      status: row.status,
      reservable: row.reservable,
      note: row.note ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!form.floor) {
      alert('Chọn tầng trước');
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      floor: form.floor,
      vehicleType: form.vehicleType || null,
      status: form.status,
      reservable: form.reservable,
      note: form.note.trim(),
    };
    try {
      if (editing) {
        await managerApi.slots.update(buildingId, editing._id, payload as Partial<ParkingSlot>);
      } else {
        await managerApi.slots.create(buildingId, payload as Partial<ParkingSlot> & { floor: string });
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const onDelete = async (row: ParkingSlot) => {
    if (!window.confirm(`Xóa ô ${row.code}?`)) return;
    try {
      await managerApi.slots.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  const onStatusChange = async (row: ParkingSlot, status: ParkingSlot['status']) => {
    try {
      await managerApi.slots.updateStatus(buildingId, row._id, status);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cập nhật thất bại');
    }
  };

  const columns: DataColumn<ParkingSlot>[] = [
    { key: 'code', title: 'Mã ô' },
    {
      key: 'floor',
      title: 'Tầng',
      render: (row) => {
        const id = typeof row.floor === 'string' ? row.floor : row.floor._id;
        const fl = floorMap.get(id);
        return fl ? `${fl.code} (${fl.levelNumber})` : '?';
      },
    },
    {
      key: 'vehicleType',
      title: 'Loại xe',
      render: (row) =>
        !row.vehicleType
          ? '—'
          : typeof row.vehicleType === 'string'
            ? row.vehicleType
            : row.vehicleType.code,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <select
          className="h-8 rounded border border-border bg-card px-2 text-xs"
          value={row.status}
          onChange={(e) => onStatusChange(row, e.target.value as ParkingSlot['status'])}
        >
          {SLOT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'reservable',
      title: 'Cho đặt',
      render: (row) => (row.reservable ? 'Có' : 'Không'),
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
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-md border border-border bg-card px-3 text-sm"
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
        >
          <option value="">Tất cả tầng</option>
          {floors.map((f) => (
            <option key={f._id} value={f._id}>
              {f.code} - {f.name}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-border bg-card px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {SLOT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <Button onClick={openCreate} className="gap-2">
          <Plus size={14} /> Thêm ô đỗ
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <DataTable title={`Ô đỗ (${items.length})`} rows={items} columns={columns} />
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Sửa ô đỗ' : 'Thêm ô đỗ'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Mã ô</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Tầng</label>
            <select
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={form.floor}
              onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
            >
              <option value="">Chọn tầng</option>
              {floors.map((fl) => (
                <option key={fl._id} value={fl._id}>
                  {fl.code} - {fl.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Loại xe (tùy chọn)</label>
            <select
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={form.vehicleType}
              onChange={(e) => setForm((f) => ({ ...f, vehicleType: e.target.value }))}
            >
              <option value="">— Không cố định —</option>
              {vehicleTypes.map((vt) => (
                <option key={vt._id} value={vt._id}>
                  {vt.code} - {vt.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Trạng thái</label>
            <select
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as ParkingSlot['status'] }))
              }
            >
              {SLOT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.reservable}
              onChange={(e) => setForm((f) => ({ ...f, reservable: e.target.checked }))}
            />
            <span>Cho phép đặt chỗ trước</span>
          </label>
          <div className="grid gap-1.5 md:col-span-2">
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
