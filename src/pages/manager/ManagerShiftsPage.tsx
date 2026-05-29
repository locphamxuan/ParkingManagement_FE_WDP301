import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Users,
  Clock,
  ChevronRight,
  X,
  CalendarDays,
  AlertTriangle,
  Pencil,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ModalForm } from '@/components/shared/ModalForm';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Shift, type StaffShift } from '@/services/manager/managerApi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StaffMember {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface ShiftFormState {
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface AssignFormState {
  staffIds: string[];
  shiftId: string;
  workDate: string;
  note: string;
}

const today = new Date().toISOString().slice(0, 10);

const emptyShift: ShiftFormState = {
  code: '', name: '', startTime: '06:00', endTime: '14:00', isActive: true,
};
const emptyAssign: AssignFormState = {
  staffIds: [], shiftId: '', workDate: today, note: '',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function ManagerShiftsPage() {
  const { buildingId } = useBuildingContext();

  const [tab, setTab] = useState<'shifts' | 'assignments'>('shifts');

  // Shifts
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [shiftsError, setShiftsError] = useState<string | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftForm, setShiftForm] = useState<ShiftFormState>(emptyShift);
  const [savingShift, setSavingShift] = useState(false);
  const [shiftFormError, setShiftFormError] = useState<string | null>(null);

  // Delete shift
  const [pendingDeleteShift, setPendingDeleteShift] = useState<Shift | null>(null);
  const [deletingShift, setDeletingShift] = useState(false);

  // Staff list
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // Staff assignments tab
  const [staffShifts, setStaffShifts] = useState<StaffShift[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState<AssignFormState>(emptyAssign);
  const [savingAssign, setSavingAssign] = useState(false);
  const [assignFormError, setAssignFormError] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState(today);

  // Delete assignment
  const [pendingDeleteAssign, setPendingDeleteAssign] = useState<StaffShift | null>(null);
  const [deletingAssign, setDeletingAssign] = useState(false);

  // Shift detail panel — staff list for a specific shift
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [panelDate, setPanelDate] = useState(today);
  const [panelStaff, setPanelStaff] = useState<StaffShift[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);

  // ── Loaders ──────────────────────────────────────────────────────────────────

  const refreshShifts = useCallback(() => {
    setShiftsLoading(true);
    setShiftsError(null);
    managerApi.shifts
      .list(buildingId)
      .then((res) => setShifts(res.data?.items ?? []))
      .catch((err) => setShiftsError(err instanceof Error ? err.message : 'Failed to load shifts'))
      .finally(() => setShiftsLoading(false));
  }, [buildingId]);

  const refreshStaff = useCallback(() => {
    managerApi.shifts
      .listStaff(buildingId)
      .then((res) => {
        const raw = res.data?.items ?? (Array.isArray(res.data) ? res.data : []);
        setStaffList(raw as StaffMember[]);
      })
      .catch(() => setStaffList([]));
  }, [buildingId]);

  const refreshAssignments = useCallback(() => {
    setAssignLoading(true);
    setAssignError(null);
    managerApi.shifts
      .listStaffShifts(buildingId, filterDate ? { from: filterDate, to: filterDate } : {})
      .then((res) => setStaffShifts(res.data?.items ?? []))
      .catch((err) => setAssignError(err instanceof Error ? err.message : 'Failed to load assignments'))
      .finally(() => setAssignLoading(false));
  }, [buildingId, filterDate]);

  // Load staff for selected shift panel
  const loadPanelStaff = useCallback(async (shift: Shift, date: string) => {
    setPanelLoading(true);
    setPanelStaff([]);
    try {
      const res = await managerApi.shifts.listStaffShifts(buildingId, { from: date, to: date });
      const all: StaffShift[] = res.data?.items ?? [];
      setPanelStaff(all.filter((ss) => ss.shift._id === shift._id));
    } catch {
      setPanelStaff([]);
    } finally {
      setPanelLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { refreshShifts(); }, [refreshShifts]);
  useEffect(() => { refreshStaff(); }, [refreshStaff]);
  useEffect(() => {
    if (tab === 'assignments') refreshAssignments();
  }, [tab, refreshAssignments]);

  useEffect(() => {
    if (selectedShift) loadPanelStaff(selectedShift, panelDate);
  }, [selectedShift, panelDate, loadPanelStaff]);

  // ── Shift CRUD ───────────────────────────────────────────────────────────────

  const openCreateShift = () => {
    setEditingShift(null);
    setShiftForm(emptyShift);
    setShiftFormError(null);
    setShiftModalOpen(true);
  };

  const openEditShift = (row: Shift, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingShift(row);
    setShiftForm({ code: row.code, name: row.name, startTime: row.startTime, endTime: row.endTime, isActive: row.isActive });
    setShiftFormError(null);
    setShiftModalOpen(true);
  };

  const saveShift = async () => {
    setShiftFormError(null);
    const payload = {
      code: shiftForm.code.trim().toUpperCase(),
      name: shiftForm.name.trim(),
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      isActive: shiftForm.isActive,
    };
    if (!payload.code || !payload.name) { setShiftFormError('Please enter both shift code and name.'); return; }
    try {
      setSavingShift(true);
      if (editingShift) {
        await managerApi.shifts.update(buildingId, editingShift._id, payload);
      } else {
        await managerApi.shifts.create(buildingId, payload);
      }
      setShiftModalOpen(false);
      refreshShifts();
    } catch (err) {
      setShiftFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingShift(false);
    }
  };

  const confirmDeleteShift = async () => {
    if (!pendingDeleteShift) return;
    try {
      setDeletingShift(true);
      await managerApi.shifts.remove(buildingId, pendingDeleteShift._id);
      if (selectedShift?._id === pendingDeleteShift._id) setSelectedShift(null);
      refreshShifts();
      setPendingDeleteShift(null);
    } catch (err) {
      setShiftsError(err instanceof Error ? err.message : 'Delete failed');
      setPendingDeleteShift(null);
    } finally {
      setDeletingShift(false);
    }
  };

  // ── Assignment CRUD ───────────────────────────────────────────────────────────

  const openAssignModal = (preShiftId?: string) => {
    setAssignForm({ ...emptyAssign, workDate: filterDate || today, shiftId: preShiftId ?? '' });
    setAssignFormError(null);
    setAssignModalOpen(true);
  };

  const toggleStaff = (id: string) => {
    setAssignForm((f) => ({
      ...f,
      staffIds: f.staffIds.includes(id) ? f.staffIds.filter((s) => s !== id) : [...f.staffIds, id],
    }));
  };

  const saveAssignment = async () => {
    setAssignFormError(null);
    if (assignForm.staffIds.length === 0) { setAssignFormError('Please select at least one staff member.'); return; }
    if (!assignForm.shiftId) { setAssignFormError('Please select a shift.'); return; }
    if (!assignForm.workDate) { setAssignFormError('Please select a work date.'); return; }
    try {
      setSavingAssign(true);
      await Promise.all(
        assignForm.staffIds.map((staffId) =>
          managerApi.shifts.assignStaffShift(buildingId, {
            staff: staffId,
            shift: assignForm.shiftId,
            workDate: assignForm.workDate,
            note: assignForm.note || undefined,
          }),
        ),
      );
      setAssignModalOpen(false);
      refreshAssignments();
      if (selectedShift) loadPanelStaff(selectedShift, panelDate);
    } catch (err) {
      setAssignFormError(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setSavingAssign(false);
    }
  };

  const confirmDeleteAssign = async () => {
    if (!pendingDeleteAssign) return;
    try {
      setDeletingAssign(true);
      await managerApi.shifts.removeStaffShift(buildingId, pendingDeleteAssign._id);
      setStaffShifts((prev) => prev.filter((s) => s._id !== pendingDeleteAssign._id));
      if (selectedShift) loadPanelStaff(selectedShift, panelDate);
      setPendingDeleteAssign(null);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Failed to remove assignment');
      setPendingDeleteAssign(null);
    } finally {
      setDeletingAssign(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="grid gap-4">

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border pb-0">
        {([
          { key: 'shifts', label: 'Shift definitions', icon: Clock },
          { key: 'assignments', label: 'Staff assignments', icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1 — Shift definitions
      ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'shifts' && (
        <div className={`grid gap-4 transition-all ${selectedShift ? 'xl:grid-cols-[1fr_380px]' : ''}`}>

          {/* ── Left: shift list ────────────────────────────────────────────── */}
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {shiftsLoading ? 'Loading...' : `${shifts.length} shift${shifts.length !== 1 ? 's' : ''}`}
              </p>
              <Button onClick={openCreateShift} size="sm" className="gap-1.5">
                <Plus size={14} /> Add Shift
              </Button>
            </div>

            {shiftsError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle size={14} className="shrink-0" /> {shiftsError}
              </div>
            )}

            {shiftsLoading ? (
              <div className="grid gap-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : shifts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                <Clock size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No shifts yet.</p>
                <Button onClick={openCreateShift} variant="secondary" size="sm" className="mt-3">
                  Create First Shift
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                {shifts.map((shift) => {
                  const isSelected = selectedShift?._id === shift._id;
                  return (
                    <button
                      key={shift._id}
                      onClick={() => setSelectedShift(isSelected ? null : shift)}
                      className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all hover:border-primary/40 hover:bg-primary/5 ${
                        isSelected
                          ? 'border-primary/50 bg-primary/8 ring-1 ring-primary/20'
                          : 'border-border bg-card'
                      }`}
                    >
                      {/* Time badge */}
                      <div className="flex w-24 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-muted/50 py-2 px-1">
                        <span className="text-[11px] font-black tabular-nums text-foreground">
                          {shift.startTime}
                        </span>
                        <div className="my-0.5 h-2.5 w-px bg-border" />
                        <span className="text-[11px] font-black tabular-nums text-muted-foreground">
                          {shift.endTime}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono font-bold text-foreground">
                            {shift.code}
                          </span>
                          <span className="truncate text-sm font-semibold text-foreground">
                            {shift.name}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Click to view assigned staff
                        </p>
                      </div>

                      <StatusBadge status={shift.isActive ? 'active' : 'inactive'} />

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          className="rounded-lg p-1.5 hover:bg-muted"
                          onClick={(e) => openEditShift(shift, e)}
                          title="Edit"
                        >
                          <Pencil size={13} className="text-muted-foreground" />
                        </button>
                        <button
                          className="rounded-lg p-1.5 hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); setPendingDeleteShift(shift); }}
                          title="Delete"
                        >
                          <Trash2 size={13} className="text-red-500" />
                        </button>
                      </div>

                      <ChevronRight
                        size={16}
                        className={`shrink-0 text-muted-foreground transition-transform ${isSelected ? 'rotate-90 text-primary' : ''}`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right: Staff panel ──────────────────────────────────────────── */}
          {selectedShift && (
            <div className="rounded-2xl border border-border bg-card">
              {/* Panel header */}
              <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-primary" />
                    <p className="text-sm font-bold text-foreground">
                      {selectedShift.code} — {selectedShift.name}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {selectedShift.startTime} – {selectedShift.endTime}
                  </p>
                </div>
                <button
                  className="rounded-lg p-1 hover:bg-muted"
                  onClick={() => setSelectedShift(null)}
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>

              {/* Date picker */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <CalendarDays size={13} className="text-muted-foreground" />
                <label className="text-xs text-muted-foreground">Date</label>
                <Input
                  type="date"
                  value={panelDate}
                  onChange={(e) => setPanelDate(e.target.value)}
                  className="h-7 w-36 text-xs"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="ml-auto h-7 gap-1 text-xs px-2"
                  onClick={() => openAssignModal(selectedShift._id)}
                >
                  <Plus size={12} /> Assign
                </Button>
              </div>

              {/* Staff list */}
              <div className="p-3">
                {panelLoading ? (
                  <div className="grid gap-2">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : panelStaff.length === 0 ? (
                  <div className="py-8 text-center">
                    <UserCheck size={24} className="mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No staff assigned
                    </p>
                    <p className="text-xs text-muted-foreground/60">on {fmtDate(panelDate)}</p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-3 text-xs"
                      onClick={() => openAssignModal(selectedShift._id)}
                    >
                      <Plus size={12} className="mr-1" /> Assign Now
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {panelStaff.map((ss) => (
                      <div
                        key={ss._id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                          {ss.staff.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {ss.staff.fullName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{ss.staff.email}</p>
                        </div>
                        <StatusBadge status={ss.status} />
                        <button
                          className="rounded-lg p-1.5 hover:bg-red-50"
                          onClick={() => setPendingDeleteAssign(ss)}
                          title="Remove assignment"
                        >
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2 — Staff assignments
      ═══════════════════════════════════════════════════════════════════════ */}
      {tab === 'assignments' && (
        <div className="grid gap-3">
          {/* Filter bar */}
          <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="grid gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Filter by date
              </label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-9 w-44"
              />
            </div>
            <Button onClick={refreshAssignments} variant="secondary" size="sm" className="h-9">
              Apply
            </Button>
            <Button onClick={() => openAssignModal()} size="sm" className="ml-auto h-9 gap-1.5">
              <Plus size={14} /> Assign Staff
            </Button>
          </div>

          {assignError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle size={14} className="shrink-0" /> {assignError}
            </div>
          )}

          {/* Assignment list */}
          {assignLoading ? (
            <div className="grid gap-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : staffShifts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center">
              <Users size={28} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No assignments{filterDate ? ` on ${fmtDate(filterDate)}` : ''}.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {staffShifts.length} assignment{staffShifts.length !== 1 ? 's' : ''}{filterDate ? ` — ${fmtDate(filterDate)}` : ''}
              </p>
              <div className="grid gap-2">
                {staffShifts.map((ss) => (
                  <div
                    key={ss._id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                      {ss.staff.fullName.charAt(0).toUpperCase()}
                    </div>

                    {/* Staff info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{ss.staff.fullName}</p>
                      <p className="text-xs text-muted-foreground">{ss.staff.email}</p>
                    </div>

                    {/* Shift pill */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1">
                      <Clock size={11} className="text-muted-foreground" />
                      <span className="text-[11px] font-mono font-bold text-foreground">
                        {ss.shift.code}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {ss.shift.startTime}–{ss.shift.endTime}
                      </span>
                    </div>

                    {/* Date */}
                    <span className="text-xs text-muted-foreground">{fmtDate(ss.workDate)}</span>

                    <StatusBadge status={ss.status} />

                    {ss.note && (
                      <span className="text-xs italic text-muted-foreground">{ss.note}</span>
                    )}

                    <button
                      className="ml-auto rounded-lg p-2 hover:bg-red-50"
                      onClick={() => setPendingDeleteAssign(ss)}
                      title="Remove assignment"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Modals & Dialogs ─────────────────────────────────────────────────── */}

      {/* Add / Edit shift */}
      <ModalForm
        open={shiftModalOpen}
        onOpenChange={(o) => { if (!o) setShiftModalOpen(false); }}
        title={editingShift ? 'Edit Shift' : 'Add Shift'}
        onSubmit={saveShift}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Shift Code <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="E.g. S1"
              value={shiftForm.code}
              onChange={(e) => setShiftForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Shift Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="E.g. Morning shift"
              value={shiftForm.name}
              onChange={(e) => setShiftForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Time</label>
            <Input
              type="time"
              value={shiftForm.startTime}
              onChange={(e) => setShiftForm((f) => ({ ...f, startTime: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">End Time</label>
            <Input
              type="time"
              value={shiftForm.endTime}
              onChange={(e) => setShiftForm((f) => ({ ...f, endTime: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={shiftForm.isActive}
              onChange={(e) => setShiftForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 accent-primary"
            />
            <span>Activate this shift</span>
          </label>
        </div>
        {shiftFormError && (
          <p className="text-sm text-red-600 mt-1">{shiftFormError}</p>
        )}
        {savingShift && <p className="text-xs text-muted-foreground">Saving...</p>}
      </ModalForm>

      {/* Assign staff modal */}
      <ModalForm
        open={assignModalOpen}
        onOpenChange={(o) => { if (!o) setAssignModalOpen(false); }}
        title="Assign Staff to Shift"
        onSubmit={saveAssignment}
      >
        <div className="grid gap-4">
          {/* Staff multi-select */}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Staff <span className="text-red-500">*</span>
              </label>
              {assignForm.staffIds.length > 0 && (
                <span className="text-xs font-semibold text-primary">
                  {assignForm.staffIds.length} selected
                </span>
              )}
            </div>
            {staffList.length === 0 ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                No staff found in this building. An admin must assign staff first.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-secondary p-2 space-y-0.5">
                {staffList.map((s) => (
                  <label
                    key={s._id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-muted ${
                      assignForm.staffIds.includes(s._id) ? 'bg-primary/10' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={assignForm.staffIds.includes(s._id)}
                      onChange={() => toggleStaff(s._id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <div className="min-w-0">
                      <p className="font-medium leading-tight truncate">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Shift selector */}
          <div className="grid gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Shift <span className="text-red-500">*</span>
            </label>
            <select
              value={assignForm.shiftId}
              onChange={(e) => setAssignForm((f) => ({ ...f, shiftId: e.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Select shift —</option>
              {shifts.filter((s) => s.isActive).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} · {s.name} ({s.startTime}–{s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Work Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={assignForm.workDate}
                onChange={(e) => setAssignForm((f) => ({ ...f, workDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Note</label>
              <Input
                placeholder="Optional"
                value={assignForm.note}
                onChange={(e) => setAssignForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>

          {assignFormError && <p className="text-sm text-red-600">{assignFormError}</p>}
          {savingAssign && <p className="text-xs text-muted-foreground">Saving...</p>}
        </div>
      </ModalForm>

      {/* Confirm delete shift */}
      <ConfirmModal
        open={Boolean(pendingDeleteShift)}
        title="Delete Shift"
        description={`Are you sure you want to delete shift "${pendingDeleteShift?.code} — ${pendingDeleteShift?.name}"? This cannot be undone.`}
        confirmLabel="Delete Shift"
        isConfirming={deletingShift}
        onOpenChange={(o) => { if (!o) setPendingDeleteShift(null); }}
        onConfirm={confirmDeleteShift}
      />

      {/* Confirm delete assignment */}
      <ConfirmModal
        open={Boolean(pendingDeleteAssign)}
        title="Remove Assignment"
        description={`Remove assignment of "${pendingDeleteAssign?.staff.fullName}" from shift "${pendingDeleteAssign?.shift.code}" on ${pendingDeleteAssign ? fmtDate(pendingDeleteAssign.workDate) : ''}?`}
        confirmLabel="Remove"
        isConfirming={deletingAssign}
        onOpenChange={(o) => { if (!o) setPendingDeleteAssign(null); }}
        onConfirm={confirmDeleteAssign}
      />
    </div>
  );
}
