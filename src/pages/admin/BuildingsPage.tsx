import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { CustomSelect } from '@/components/ui/select';
import { ModalForm } from '@/components/modals/ModalForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import { useAuth } from '@/hooks/useAuth';
import {
  createBuilding,
  deleteAdminUser,
  deleteBuilding,
  updateBuilding,
  updateBuildingStatus,
  revokeStaffFromBuilding,
  revokeManagerFromBuilding,
  assignManagerToBuilding,
} from '@/services/admin/adminCrud';
import {
  adminApi,
  type AdminUser,
  type AdminPricePolicy,
  type AdminBuildingPackage,
} from '@/services/admin/adminApi';
import type { Building } from '@/types';
import { BuildingCard } from '@/components/admin/buildings/BuildingCard';
import { BuildingMembersModal, type MembersState } from '@/components/admin/buildings/BuildingMembersModal';
import { BuildingDetailModal, type DetailState } from '@/components/admin/buildings/BuildingDetailModal';

const PAGE_SIZE = 10;

export function BuildingsPage() {
  const { data, isLoading, error, refresh } = useAdminDataset();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteBuilding, setPendingDeleteBuilding] = useState<Building | null>(null);

  const [membersState, setMembersState] = useState<MembersState | null>(null);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [unassignedManagers, setUnassignedManagers] = useState<AdminUser[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);

  const [pendingDeleteMember, setPendingDeleteMember] = useState<AdminUser | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const [detailState, setDetailState] = useState<DetailState | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
  });

  const filtered = useMemo(() => {
    const source = data?.buildings ?? [];
    return source.filter((item) => {
      const q = query.trim().toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.manager.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data?.buildings, query, statusFilter]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading buildings...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Failed to load buildings.'}</div>;
  }

  const token = session?.token || '';

  const openViewMembers = async (building: Building) => {
    const bid = building.backendId || building.id;
    setMembersState({ buildingId: bid, buildingName: building.name, manager: null, staff: [] });
    setIsMembersLoading(true);
    setMembersError(null);
    setUnassignedManagers([]);
    try {
      const res = await adminApi.buildings.getMembers(bid);
      const manager = res.data?.manager ?? null;
      setMembersState({
        buildingId: bid,
        buildingName: building.name,
        manager,
        staff: res.data?.staff ?? [],
      });
      if (!manager) {
        setIsLoadingManagers(true);
        try {
          const userRes = await adminApi.users.list({ role: 'manager', limit: '200' });
          const raw = userRes as unknown as { data?: { items?: AdminUser[] } | AdminUser[] };
          const list =
            (raw?.data as { items?: AdminUser[] })?.items ??
            (Array.isArray(raw?.data) ? (raw.data as AdminUser[]) : []);
          const unassigned = list.filter(
            (u) => !u.assignedBuildings || u.assignedBuildings.length === 0
          );
          setUnassignedManagers(unassigned);
        } catch (err) {
          console.error('Unable to load managers:', err);
        } finally {
          setIsLoadingManagers(false);
        }
      }
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Unable to load members');
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleAssignManager = async (managerId: string) => {
    if (!token || !membersState) return;
    setIsMembersLoading(true);
    setMembersError(null);
    try {
      await assignManagerToBuilding(membersState.buildingId, managerId);
      const res = await adminApi.buildings.getMembers(membersState.buildingId);
      setMembersState({
        ...membersState,
        manager: res.data?.manager ?? null,
        staff: res.data?.staff ?? [],
      });
      await refresh();
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Unable to assign manager');
    } finally {
      setIsMembersLoading(false);
    }
  };

  const openViewDetail = async (building: Building) => {
    const bid = building.backendId || building.id;
    setDetailState({ buildingName: building.name, pricePolicies: [], packages: [] });
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const [policyRes, pkgRes] = await Promise.all([
        adminApi.buildings.listPricePolicies(bid),
        adminApi.buildings.listPackages(bid),
      ]);
      setDetailState({
        buildingName: building.name,
        pricePolicies: (policyRes as { data?: { items: AdminPricePolicy[] } })?.data?.items ?? [],
        packages: (pkgRes as { data?: { items: AdminBuildingPackage[] } })?.data?.items ?? [],
      });
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Unable to load building details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const confirmDeleteMember = async () => {
    if (!token || !pendingDeleteMember || !membersState) return;
    const isManager = membersState.manager?._id === pendingDeleteMember._id;
    const buildingId = membersState.buildingId;
    try {
      setIsDeletingMember(true);
      if (isManager) {
        await revokeManagerFromBuilding(buildingId, pendingDeleteMember._id);
      } else {
        await revokeStaffFromBuilding(buildingId, pendingDeleteMember._id);
      }
      await deleteAdminUser(pendingDeleteMember._id);
      setMembersState((prev) =>
        prev
          ? {
              ...prev,
              manager: isManager ? null : prev.manager,
              staff: prev.staff.filter((s) => s._id !== pendingDeleteMember._id),
            }
          : null,
      );
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete member');
    } finally {
      setIsDeletingMember(false);
      setPendingDeleteMember(null);
    }
  };

  const openCreateModal = () => {
    setActionError(null);
    setSelectedBuilding(null);
    setForm({ name: '', code: '', address: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (building: Building) => {
    setActionError(null);
    setSelectedBuilding(building);
    setForm({
      name: building.name,
      code: building.id,
      address: building.address,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBuilding(null);
    setIsSaving(false);
    setActionError(null);
  };

  const saveBuilding = async () => {
    if (!token) return;
    try {
      setIsSaving(true);
      setActionError(null);
      if (selectedBuilding) {
        await updateBuilding(selectedBuilding.backendId || selectedBuilding.id, {
          name: form.name,
          code: form.code,
          fullAddress: form.address,
        });
      } else {
        // Floors & pricing: manager tự thiết lập (tạo floor + PricePolicy), admin không nhập.
        await createBuilding({
          name: form.name,
          code: form.code,
          fullAddress: form.address,
        });
      }
      await refresh();
      closeModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to save building');
      setIsSaving(false);
    }
  };

  const toggleBuildingStatus = async (building: Building) => {
    if (!token) return;
    try {
      setActionError(null);
      const nextStatus = building.status === 'active' ? 'inactive' : 'active';
      await updateBuildingStatus(building.backendId || building.id, nextStatus);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to change building status');
    }
  };

  const removeBuildingById = (building: Building) => {
    if (!token) return;
    setPendingDeleteBuilding(building);
  };

  const confirmRemoveBuilding = async () => {
    if (!token || !pendingDeleteBuilding) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await deleteBuilding(pendingDeleteBuilding.backendId || pendingDeleteBuilding.id);
      await refresh();
      setPendingDeleteBuilding(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete building');
    } finally {
      setIsDeleting(false);
    }
  };

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filterOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'warning', label: 'Warning' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {actionError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-600 shadow-sm animate-in fade-in duration-200">
          {actionError}
        </div>
      ) : null}

      {/* Control Actions Row (Search, filter, create button) grouped together beautifully */}
      <div className="flex flex-col md:flex-row items-center gap-3 w-full rounded-2xl border border-sky-100/60 bg-white/45 p-3 shadow-sm backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search buildings by name or address..."
            className="h-11 w-full rounded-xl border-sky-100 bg-white/90 pl-9 text-xs font-semibold focus-visible:ring-blue-500"
          />
        </div>

        {/* Status Filter Dropdown */}
        <CustomSelect
          className="h-11 w-full md:w-48 shrink-0"
          value={statusFilter}
          onChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
          options={filterOptions}
        />

        {/* Create Building Gem Button */}
        <Button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-white rounded-xl font-black px-5 py-2.5 h-11 text-xs border-0 shadow-md flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-center"
        >
          <Plus size={14} /> Create building
        </Button>
      </div>

      {/* Premium Building Cards Grid */}
      {pageRows.length === 0 ? (
        <div className="rounded-3xl glass-premium border border-sky-100/80 p-12 text-center text-slate-500 italic">
          No buildings found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pageRows.map((b) => (
            <BuildingCard
              key={b.id}
              building={b}
              onViewDetail={openViewDetail}
              onViewMembers={openViewMembers}
              onEdit={openEditModal}
              onToggleStatus={toggleBuildingStatus}
              onDelete={removeBuildingById}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="bg-white/80 hover:bg-slate-100 text-slate-700 font-bold border border-sky-100 rounded-xl px-4 py-2 text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all h-auto"
        >
          Prev
        </Button>
        <span className="text-xs font-mono font-bold text-slate-500 px-3 py-1.5 rounded-lg bg-slate-50 border border-sky-100/50">
          Page {page} / {maxPage}
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          className="bg-white/80 hover:bg-slate-100 text-slate-700 font-bold border border-sky-100 rounded-xl px-4 py-2 text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all h-auto"
        >
          Next
        </Button>
      </div>

      {/* Members Modal */}
      {membersState ? (
        <BuildingMembersModal
          membersState={membersState}
          isLoading={isMembersLoading}
          error={membersError}
          isLoadingManagers={isLoadingManagers}
          unassignedManagers={unassignedManagers}
          onClose={() => setMembersState(null)}
          onAssignManager={handleAssignManager}
          onRequestDelete={setPendingDeleteMember}
        />
      ) : null}

      {/* Building Detail Modal (read-only operator view) */}
      {detailState ? (
        <BuildingDetailModal
          detailState={detailState}
          isLoading={isDetailLoading}
          error={detailError}
          onClose={() => setDetailState(null)}
        />
      ) : null}

      {/* Edit / Create Building Modal */}
      <ModalForm
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        title={selectedBuilding ? 'Edit building' : 'Create building'}
        onSubmit={saveBuilding}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Building name</label>
            <Input
              placeholder="Enter building name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Building code</label>
            <Input
              placeholder="Enter building code"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Address</label>
            <Input
              placeholder="Enter address"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
        </div>
        {isSaving ? <p className="text-xs text-muted-foreground">Saving...</p> : null}
      </ModalForm>

      <ConfirmModal
        open={Boolean(pendingDeleteBuilding)}
        title="Confirm delete building"
        description={`Are you sure you want to delete building ${pendingDeleteBuilding?.name || ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteBuilding(null);
        }}
        onConfirm={confirmRemoveBuilding}
      />

      <ConfirmModal
        open={Boolean(pendingDeleteMember)}
        title={`Delete ${pendingDeleteMember?.role === 'manager' ? 'manager' : 'staff'} account`}
        description={`Permanently delete account "${pendingDeleteMember?.fullName || pendingDeleteMember?.email || ''}" (${pendingDeleteMember?.email || ''})? This action cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeletingMember}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteMember(null);
        }}
        onConfirm={confirmDeleteMember}
      />
    </div>
  );
}
