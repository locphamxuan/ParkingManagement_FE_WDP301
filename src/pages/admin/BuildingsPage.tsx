import { useMemo, useState } from 'react';
import { Eye, Users } from 'lucide-react';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { ModalForm } from '@/components/modals/ModalForm';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { StatusBadge } from '@/components/common/StatusBadge';
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
} from '@/services/admin/adminCrud';
import {
  adminApi,
  type AdminUser,
  type AdminPricePolicy,
  type AdminBuildingPackage,
} from '@/services/admin/adminApi';
import type { Building } from '@/types';

const PAGE_SIZE = 10;

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('en-US')} ₫` : '—';

const vehicleTypeLabel = (vt: AdminPricePolicy['vehicleType'] | AdminBuildingPackage['vehicleType']) =>
  vt && typeof vt === 'object' ? vt.name : '—';


interface MembersState {
  buildingId: string;
  buildingName: string;
  manager: AdminUser | null;
  staff: AdminUser[];
}

interface DetailState {
  buildingName: string;
  pricePolicies: AdminPricePolicy[];
  packages: AdminBuildingPackage[];

}

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

  const [pendingDeleteMember, setPendingDeleteMember] = useState<AdminUser | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const [detailState, setDetailState] = useState<DetailState | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);


  const [form, setForm] = useState({
    name: '',
    code: '',
    floors: '1',
    address: '',
    hourlyRate: '0',
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
    try {
      const res = await adminApi.buildings.getMembers(bid);
      setMembersState({
        buildingId: bid,
        buildingName: building.name,
        manager: res.data?.manager ?? null,
        staff: res.data?.staff ?? [],
      });
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Unable to load building members');
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
        await revokeManagerFromBuilding(token, buildingId, pendingDeleteMember._id);
      } else {
        await revokeStaffFromBuilding(token, buildingId, pendingDeleteMember._id);
      }
      await deleteAdminUser(token, pendingDeleteMember._id);
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
      setActionError(err instanceof Error ? err.message : 'Unable to remove member');
    } finally {
      setIsDeletingMember(false);
      setPendingDeleteMember(null);
    }
  };

  const openCreateModal = () => {
    setActionError(null);
    setSelectedBuilding(null);
    setForm({ name: '', code: '', floors: '1', address: '', hourlyRate: '0' });
    setIsModalOpen(true);
  };

  const openEditModal = (building: Building) => {
    setActionError(null);
    setSelectedBuilding(building);
    setForm({
      name: building.name,
      code: building.id,
      floors: String(building.floors),
      address: building.address,
      hourlyRate: '0',
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
        await updateBuilding(token, selectedBuilding.backendId || selectedBuilding.id, {
          name: form.name,
          code: form.code,
          totalFloors: Number(form.floors),
          fullAddress: form.address,
        });
      } else {
        await createBuilding(token, {
          name: form.name,
          code: form.code,
          totalFloors: Number(form.floors),
          fullAddress: form.address,
          hourlyRate: Number(form.hourlyRate),
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
      await updateBuildingStatus(token, building.backendId || building.id, nextStatus);
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
      await deleteBuilding(token, pendingDeleteBuilding.backendId || pendingDeleteBuilding.id);
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

  const columns: DataColumn<Building>[] = [
    { key: 'name', title: 'Building name' },
    { key: 'address', title: 'Address' },
    { key: 'floors', title: 'Total floors' },
    {
      key: 'occupancyRate',
      title: 'Occupancy rate',
      render: (row) => (
        <div className="w-32">
          <div className="mb-1 text-xs text-muted-foreground">{row.occupancyRate}%</div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${row.occupancyRate}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'manager', title: 'Manager' },
    {
      key: 'revenueToday',
      title: 'Today\'s revenue',
      render: (row) => `${row.revenueToday.toLocaleString('vi-VN')} ₫`,
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1"
            onClick={() => openViewDetail(row)}
          >
            <Eye size={12} /> Details
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1"
            onClick={() => openViewMembers(row)}
          >
            <Users size={12} />Members</Button>
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toggleBuildingStatus(row)}>
            {row.status === 'active' ? 'Suspend' : 'Activate'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => removeBuildingById(row)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      {actionError ? <div className="text-sm text-red-600">{actionError}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchFilterBar
          query={query}
          onQueryChange={(value) => {
            setPage(1);
            setQuery(value);
          }}
          filterValue={statusFilter}
          onFilterChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
          filterOptions={['all', 'active', 'inactive', 'maintenance', 'warning']}
        />
        <Button onClick={openCreateModal}>Create building</Button>
      </div>

      <DataTable title="Building" rows={pageRows} columns={columns} />

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
        <span className="text-sm text-muted-foreground">
          Trang {page} / {maxPage}
        </span>
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>Next</Button>
      </div>

      {/* Members Modal */}
      {membersState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Members — {membersState.buildingName}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setMembersState(null)}>
                ✕
              </Button>
            </div>

            {isMembersLoading ? (
              <p className="text-sm text-muted-foreground">Loading members...</p>
            ) : membersError ? (
              <p className="text-sm text-red-600">{membersError}</p>
            ) : (
              <div className="grid gap-4">
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Management</h3>
                  {membersState.manager ? (
                    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                      <div>
                        <p className="font-medium">{membersState.manager.fullName}</p>
                        <p className="text-muted-foreground">{membersState.manager.email}</p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setPendingDeleteMember(membersState.manager!)}
                      >Delete</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No manager yet</p>
                  )}
                </section>

                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Staff ({membersState.staff.length})
                  </h3>
                  {membersState.staff.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No staff yet</p>
                  ) : (
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                      {membersState.staff.map((s) => (
                        <div
                          key={s._id}
                          className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm"
                        >
                          <div>
                            <p className="font-medium">{s.fullName}</p>
                            <p className="text-muted-foreground">{s.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={s.isActive ? 'active' : 'inactive'} />
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setPendingDeleteMember(s)}
                            >Delete</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Building Detail Modal (read-only operator view) */}
      {detailState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Building details — {detailState.buildingName}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setDetailState(null)}>
                ✕
              </Button>
            </div>

            {isDetailLoading ? (
              <p className="text-sm text-muted-foreground">Loading building details...</p>
            ) : detailError ? (
              <p className="text-sm text-red-600">{detailError}</p>
            ) : (
              <div className="grid max-h-[70vh] gap-5 overflow-y-auto">
                {/* Price policies */}
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Price policies ({detailState.pricePolicies.length})
                  </h3>
                  {detailState.pricePolicies.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">No price policies configured for this building.</p>
                  ) : (
                    <div className="grid gap-2">
                      {detailState.pricePolicies.map((p) => (
                        <div key={p._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {vehicleTypeLabel(p.vehicleType)} · {fmtVnd(p.hourlyRate)}/h
                              {p.dailyCap ? ` · daily cap ${fmtVnd(p.dailyCap)}` : ''}
                            </p>
                          </div>
                          <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Building long-term packages */}
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Long-term packages ({detailState.packages.length})
                  </h3>
                  {detailState.packages.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">No long-term packages published for this building.</p>
                  ) : (
                    <div className="grid gap-2">
                      {detailState.packages.map((pkg) => (
                        <div key={pkg._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                          <div>
                            <p className="font-medium">
                              {pkg.name}
                              {pkg.code && <span className="ml-1.5 font-mono text-xs text-muted-foreground">{pkg.code}</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {vehicleTypeLabel(pkg.vehicleType)} · {fmtVnd(pkg.price)} · {pkg.durationDays} days
                            </p>
                          </div>
                          <StatusBadge status={pkg.isActive ? 'active' : 'inactive'} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
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
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Building name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Input
            placeholder="Building code"
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          />
          <Input
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
          <Input
            placeholder="Total floors"
            value={form.floors}
            onChange={(e) => setForm((prev) => ({ ...prev, floors: e.target.value }))}
          />
          {!selectedBuilding ? (
            <Input
              placeholder="Hourly rate (VND)"
              value={form.hourlyRate}
              onChange={(e) => setForm((prev) => ({ ...prev, hourlyRate: e.target.value }))}
            />
          ) : null}
        </div>
        {isSaving ? <p className="text-xs text-muted-foreground">Saving...</p> : null}
      </ModalForm>

      <ConfirmModal
        open={Boolean(pendingDeleteBuilding)}
        title="Confirm building deletion"
        description={`Are you sure you want to delete the building ${pendingDeleteBuilding?.name || ''}? This action cannot be undone.`}
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
        description={`Permanently delete the account "${pendingDeleteMember?.fullName || pendingDeleteMember?.email || ''}" (${pendingDeleteMember?.email || ''})? This action cannot be undone.`}
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
