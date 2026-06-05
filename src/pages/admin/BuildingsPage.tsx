import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { DataTable, type DataColumn } from "@/components/shared/DataTable";
import { ModalForm } from "@/components/shared/ModalForm";
import { SearchFilterBar } from "@/components/shared/SearchFilterBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminDataset } from "@/hooks/admin/useAdminDataset";
import { useAuth } from "@/hooks/useAuth";
import {
  createBuilding,
  deleteAdminUser,
  deleteBuilding,
  updateBuilding,
  updateBuildingStatus,
  revokeStaffFromBuilding,
  revokeManagerFromBuilding,
} from "@/services/admin/adminCrud";
import { adminApi, type AdminUser, type ManagerSubscriptionStatus, type AdminSubscriptionPackage } from "@/services/admin/adminApi";
import type { Building } from "@/types";

const PAGE_SIZE = 3;

interface MembersState {
  buildingId: string;
  buildingName: string;
  manager: AdminUser | null;
  staff: AdminUser[];
  subscription: ManagerSubscriptionStatus | null;
}

export function BuildingsPage() {
  const { data, isLoading, error, refresh } = useAdminDataset();
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteBuilding, setPendingDeleteBuilding] = useState<Building | null>(null);

  // Members modal state
  const [membersState, setMembersState] = useState<MembersState | null>(null);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Delete member state
  const [pendingDeleteMember, setPendingDeleteMember] = useState<AdminUser | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [showSubDetails, setShowSubDetails] = useState(false);

  // Admin subscription override (grant / revoke for a building's manager)
  const [subPackages, setSubPackages] = useState<AdminSubscriptionPackage[]>([]);
  const [grantPackageId, setGrantPackageId] = useState("");
  const [subActionLoading, setSubActionLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    floors: "1",
    address: "",
    hourlyRate: "0",
  });

  const filtered = useMemo(() => {
    const source = data?.buildings ?? [];
    return source.filter((item) => {
      const q = query.trim().toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.manager.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data?.buildings, query, statusFilter]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading buildings...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || "Failed to load buildings."}</div>;
  }

  const token = session?.token || "";

  const openViewMembers = async (building: Building) => {
    const bid = building.backendId || building.id;
    setShowSubDetails(false);
    setMembersState({ buildingId: bid, buildingName: building.name, manager: null, staff: [], subscription: null });
    setIsMembersLoading(true);
    setMembersError(null);
    try {
      const [res, pkgRes] = await Promise.all([
        adminApi.buildings.getMembers(bid),
        adminApi.subscriptionPackages.list(),
      ]);
      setMembersState({
        buildingId: bid,
        buildingName: building.name,
        manager: res.data?.manager ?? null,
        staff: res.data?.staff ?? [],
        subscription: res.data?.subscription ?? null,
      });
      const pkgs = (pkgRes.data?.items ?? []).filter((p) => p.isActive);
      setSubPackages(pkgs);
      setGrantPackageId(pkgs[0]?._id ?? "");
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleGrantSubscription = async () => {
    if (!token || !membersState || !grantPackageId) return;
    setSubActionLoading(true);
    setActionError(null);
    try {
      const res = await adminApi.buildings.grantSubscription(membersState.buildingId, grantPackageId);
      setMembersState((prev) =>
        prev ? { ...prev, subscription: res.data?.subscription ?? prev.subscription } : prev,
      );
      setShowSubDetails(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to grant subscription");
    } finally {
      setSubActionLoading(false);
    }
  };

  const handleRevokeSubscription = async () => {
    if (!token || !membersState) return;
    setSubActionLoading(true);
    setActionError(null);
    try {
      const res = await adminApi.buildings.revokeSubscription(membersState.buildingId);
      setMembersState((prev) =>
        prev ? { ...prev, subscription: res.data?.subscription ?? null } : prev,
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to revoke subscription");
    } finally {
      setSubActionLoading(false);
    }
  };

  const confirmDeleteMember = async () => {
    if (!token || !pendingDeleteMember || !membersState) return;
    const isManager = membersState.manager?._id === pendingDeleteMember._id;
    const buildingId = membersState.buildingId;
    try {
      setIsDeletingMember(true);
      // Bước 1: Revoke khỏi building trước (nếu không, BE sẽ báo 409)
      if (isManager) {
        await revokeManagerFromBuilding(token, buildingId, pendingDeleteMember._id);
      } else {
        await revokeStaffFromBuilding(token, buildingId, pendingDeleteMember._id);
      }
      // Bước 2: Xóa tài khoản
      await deleteAdminUser(token, pendingDeleteMember._id);
      // Bước 3: Cập nhật local state
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
      setActionError(err instanceof Error ? err.message : "Unable to delete member");
    } finally {
      setIsDeletingMember(false);
      setPendingDeleteMember(null);
    }
  };

  const openCreateModal = () => {
    setActionError(null);
    setSelectedBuilding(null);
    setForm({ name: "", code: "", floors: "1", address: "", hourlyRate: "0" });
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
      hourlyRate: "0",
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
      setActionError(err instanceof Error ? err.message : "Unable to save building");
      setIsSaving(false);
    }
  };

  const toggleBuildingStatus = async (building: Building) => {
    if (!token) return;
    try {
      setActionError(null);
      const nextStatus = building.status === "active" ? "inactive" : "active";
      await updateBuildingStatus(token, building.backendId || building.id, nextStatus);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to change building status");
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
      setActionError(err instanceof Error ? err.message : "Unable to delete building");
    } finally {
      setIsDeleting(false);
    }
  };

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DataColumn<Building>[] = [
    { key: "name", title: "Building name" },
    { key: "address", title: "Address" },
    { key: "floors", title: "Floors" },
    {
      key: "occupancyRate",
      title: "Occupancy",
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
      key: "status",
      title: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: "manager", title: "Manager" },
    {
      key: "revenueToday",
      title: "Revenue today",
      render: (row) => `${row.revenueToday.toLocaleString()} VND`,
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1"
            onClick={() => openViewMembers(row)}
          >
            <Users size={12} /> Members
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toggleBuildingStatus(row)}>
            {row.status === "active" ? "Deactivate" : "Activate"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => removeBuildingById(row)}>
            Delete
          </Button>
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
          onQueryChange={(value) => { setPage(1); setQuery(value); }}
          filterValue={statusFilter}
          onFilterChange={(value) => { setPage(1); setStatusFilter(value); }}
          filterOptions={["all", "active", "inactive", "maintenance", "warning"]}
        />
        <Button onClick={openCreateModal}>Create building</Button>
      </div>

      <DataTable title="Buildings" rows={pageRows} columns={columns} />

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page} / {maxPage}</span>
        <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>
          Next
        </Button>
      </div>

      {/* ── Building Members Modal ─────────────────────────── */}
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
                {/* Manager */}
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Manager
                  </h3>
                  {membersState.manager ? (
                    <div className="rounded-xl border border-border bg-card p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{membersState.manager.fullName}</p>
                          <p className="text-muted-foreground">{membersState.manager.email}</p>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setPendingDeleteMember(membersState.manager!)}
                        >
                          Delete
                        </Button>
                      </div>

                      {/* Subscription status — click to view package details */}
                      <div className="mt-3 border-t border-border/60 pt-3">
                        {membersState.subscription?.active ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowSubDetails((v) => !v)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 transition hover:bg-emerald-500/15"
                            >
                              ✓ Package purchased
                              <span className="text-[10px] font-normal opacity-70">
                                {showSubDetails ? "▲" : "▼"}
                              </span>
                            </button>
                            {showSubDetails ? (
                              <div className="mt-2 grid gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Package</span>
                                  <span className="font-semibold">
                                    {membersState.subscription.packageName ||
                                      membersState.subscription.package?.name ||
                                      "—"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Valid until</span>
                                  <span className="font-semibold">
                                    {membersState.subscription.endDate
                                      ? new Date(membersState.subscription.endDate).toLocaleDateString("en-US", { dateStyle: "medium" } as Intl.DateTimeFormatOptions)
                                      : "—"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Days remaining</span>
                                  <span className="font-semibold">{membersState.subscription.daysRemaining} days</span>
                                </div>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600">
                            ✕ No active package
                          </span>
                        )}

                        {/* Admin override: grant / extend / revoke the subscription */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {subPackages.length === 0 ? (
                            <p className="text-xs italic text-muted-foreground">
                              No admin packages defined. Create one in System Wallet.
                            </p>
                          ) : (
                            <>
                              <select
                                value={grantPackageId}
                                onChange={(e) => setGrantPackageId(e.target.value)}
                                className="h-9 rounded-lg border border-border bg-secondary px-2 text-xs text-foreground outline-none"
                              >
                                {subPackages.map((p) => (
                                  <option key={p._id} value={p._id}>
                                    {p.name} · {p.durationDays}d · {p.price.toLocaleString()} VND
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                onClick={handleGrantSubscription}
                                disabled={subActionLoading || !grantPackageId}
                              >
                                {membersState.subscription?.active ? "Extend" : "Grant"}
                              </Button>
                            </>
                          )}
                          {membersState.subscription?.active ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleRevokeSubscription}
                              disabled={subActionLoading}
                            >
                              Revoke
                            </Button>
                          ) : null}
                          {subActionLoading ? (
                            <span className="text-xs text-muted-foreground">Saving…</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No manager assigned</p>
                  )}
                </section>

                {/* Staff */}
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Staff ({membersState.staff.length})
                  </h3>
                  {membersState.staff.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No staff assigned</p>
                  ) : (
                    <div className="grid gap-2">
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
                            <StatusBadge status={s.isActive ? "active" : "inactive"} />
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setPendingDeleteMember(s)}
                            >
                              Delete
                            </Button>
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

      {/* ── Edit / Create Building Modal ───────────────────── */}
      <ModalForm
        open={isModalOpen}
        onOpenChange={(open) => { if (!open) closeModal(); }}
        title={selectedBuilding ? "Edit building" : "Create building"}
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
            placeholder="Floors"
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
        description={`Are you sure you want to delete building ${pendingDeleteBuilding?.name || ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onOpenChange={(open) => { if (!open) setPendingDeleteBuilding(null); }}
        onConfirm={confirmRemoveBuilding}
      />

      {/* ── Delete Member Confirm ──────────────────────────── */}
      <ConfirmModal
        open={Boolean(pendingDeleteMember)}
        title={`Delete ${pendingDeleteMember?.role === "manager" ? "manager" : "staff"} account`}
        description={`Permanently delete account "${pendingDeleteMember?.fullName || pendingDeleteMember?.email || ""}" (${pendingDeleteMember?.email || ""})?  This action cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeletingMember}
        onOpenChange={(open) => { if (!open) setPendingDeleteMember(null); }}
        onConfirm={confirmDeleteMember}
      />
    </div>
  );
}
