import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { DataTable, type DataColumn } from "@/components/shared/DataTable";
import { ModalForm } from "@/components/shared/ModalForm";
import { SearchFilterBar } from "@/components/shared/SearchFilterBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useAdminDataset } from "@/hooks/admin/useAdminDataset";
import { useAuth } from "@/hooks/useAuth";
import {
  assignBuildingMember,
  createBuilding,
  deleteBuilding,
  getBuildingMembers,
  updateBuilding,
  updateBuildingStatus,
  type BuildingAssignmentRole,
  type BuildingMembersPayload,
} from "@/services/admin/adminCrud";
import { createAdminUser } from "@/services/admin/adminCrud";
import type { Building } from "@/types";
import type { UserRecord } from "@/types";

const PAGE_SIZE = 3;

// ---------- RoleDropdown (copied from UsersPage) ----------

const ROLE_OPTIONS: Array<{ value: UserRecord["role"]; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
  { value: "user", label: "User" },
];

const ASSIGN_ROLE_OPTIONS: Array<{
  value: BuildingAssignmentRole;
  label: string;
  hint: string;
}> = [
  { value: "manager", label: "Manager", hint: "Can control the building" },
  { value: "staff", label: "Staff", hint: "Can operate the building" },
];

function AssignDropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  displayValue,
  optionClassName,
  menuClassName,
}: {
  value: T;
  options: Array<{ value: T; label: string; description?: string }>;
  onChange: (value: T) => void;
  placeholder: string;
  displayValue?: (option: {
    value: T;
    label: string;
    description?: string;
  }) => string;
  optionClassName?: (selected: boolean) => string;
  menuClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const currentOption = options.find((option) => option.value === value);
  const currentLabel = currentOption
    ? (displayValue?.(currentOption) ?? currentOption.label)
    : placeholder;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-[1.2rem] border border-border bg-secondary px-4 text-sm text-foreground outline-none transition hover:border-border/80 focus:ring-2 focus:ring-ring"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-base font-medium">{currentLabel}</span>
        <span className="-translate-y-[2px] text-xl leading-none text-muted-foreground"></span>
      </button>

      {isOpen ? (
        <div
          className={`absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full max-h-72 overflow-y-auto overscroll-contain rounded-[1.4rem] border border-border bg-background p-2 shadow-[0_14px_45px_rgba(15,23,42,0.12)] ${menuClassName || ""}`}
        >
          <div className="grid gap-1">
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={
                    optionClassName?.(selected) ??
                    `flex w-full items-center rounded-[1.1rem] px-4 py-3 text-left text-[1rem] transition-all duration-150 ${selected ? "bg-[#e8efff] text-[#2f62e0]" : "text-slate-800 hover:bg-slate-200"}`
                  }
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <div className="grid gap-0.5 text-left">
                    <span className="truncate">{option.label}</span>
                    {option.description ? (
                      <span
                        className={`text-xs ${selected ? "text-[#2f62e0]/80" : "text-slate-500"}`}
                      >
                        {option.description}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RoleDropdown({
  value,
  onChange,
}: {
  value: UserRecord["role"];
  onChange: (value: UserRecord["role"]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const currentLabel =
    ROLE_OPTIONS.find((option) => option.value === value)?.label ?? "User";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-[1.2rem] border border-border bg-secondary px-4 text-sm text-foreground outline-none transition hover:border-border/80 focus:ring-2 focus:ring-ring"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium">{currentLabel}</span>
        <span className="-translate-y-[2px] text-xl leading-none text-muted-foreground"></span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full rounded-[1.4rem] border border-border bg-background p-2 shadow-[0_14px_45px_rgba(15,23,42,0.12)]">
          <div className="grid gap-1">
            {ROLE_OPTIONS.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`flex w-full items-center rounded-[1.1rem] px-4 py-3 text-left text-[1rem] transition-all duration-150 ${
                    selected
                      ? "bg-[#e8efff] text-[#2f62e0]"
                      : "text-slate-800 hover:bg-slate-200"
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------- BuildingsPage ----------

export function BuildingsPage() {
  const { data, isLoading, error, refresh } = useAdminDataset();
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteBuilding, setPendingDeleteBuilding] =
    useState<Building | null>(null);
  const [selectedBuildingDetail, setSelectedBuildingDetail] =
    useState<Building | null>(null);
  const [buildingMembers, setBuildingMembers] =
    useState<BuildingMembersPayload | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetBuilding, setAssignTargetBuilding] =
    useState<Building | null>(null);
  const [assignRole, setAssignRole] = useState<BuildingAssignmentRole>("staff");
  const [assignUserId, setAssignUserId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    floors: "1",
    address: "",
    hourlyRate: "0",
  });

  // ---------- Create User state ----------
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "user" as UserRecord["role"],
  });

  const assignableUsers = useMemo(() => {
    const users = data?.users ?? [];

    return users.filter((user) => {
      if (user.status !== "active" || user.role === "admin") {
        return false;
      }

      if (assignRole === "manager") {
        return user.role !== "staff";
      }

      return user.role !== "manager";
    });
  }, [assignRole, data?.users]);

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

  const token = session?.token || "";

  useEffect(() => {
    if (!selectedBuildingDetail || !token) {
      setBuildingMembers(null);
      setMembersError(null);
      setIsLoadingMembers(false);
      return;
    }

    let cancelled = false;

    const loadMembers = async () => {
      try {
        setIsLoadingMembers(true);
        setMembersError(null);
        const members = await getBuildingMembers(
          token,
          selectedBuildingDetail.backendId || selectedBuildingDetail.id,
        );

        if (!cancelled) {
          setBuildingMembers(members);
        }
      } catch (err) {
        if (!cancelled) {
          setMembersError(
            err instanceof Error
              ? err.message
              : "Unable to load building members",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMembers(false);
        }
      }
    };

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, [selectedBuildingDetail, token]);

  useEffect(() => {
    if (!isAssignModalOpen) {
      return;
    }

    if (assignableUsers.length === 0) {
      setAssignUserId("");
      return;
    }

    if (!assignableUsers.some((user) => user.id === assignUserId)) {
      setAssignUserId(assignableUsers[0].id);
    }
  }, [assignUserId, assignableUsers, isAssignModalOpen]);

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading buildings...</div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-600">
        {error || "Failed to load buildings."}
      </div>
    );
  }

  // ---------- Building handlers ----------

  const openBuildingMembersModal = (building: Building) => {
    setActionError(null);
    setMembersError(null);
    setSelectedBuildingDetail(building);
  };

  const closeBuildingMembersModal = () => {
    setSelectedBuildingDetail(null);
    setBuildingMembers(null);
    setMembersError(null);
    setIsLoadingMembers(false);
  };

  const openCreateModal = () => {
    setActionError(null);
    setSelectedBuilding(null);
    setForm({
      name: "",
      code: "",
      floors: "1",
      address: "",
      hourlyRate: "0",
    });
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
        await updateBuilding(
          token,
          selectedBuilding.backendId || selectedBuilding.id,
          {
            name: form.name,
            code: form.code,
            totalFloors: Number(form.floors),
            fullAddress: form.address,
          },
        );
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
      setActionError(
        err instanceof Error ? err.message : "Unable to save building",
      );
      setIsSaving(false);
    }
  };

  const toggleBuildingStatus = async (building: Building) => {
    if (!token) return;
    try {
      setActionError(null);
      const nextStatus = building.status === "active" ? "inactive" : "active";
      await updateBuildingStatus(
        token,
        building.backendId || building.id,
        nextStatus,
      );
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to change building status",
      );
    }
  };

  const openAssignModal = (building: Building) => {
    setActionError(null);
    setAssignError(null);
    setAssignTargetBuilding(building);
    setAssignRole("staff");

    const defaultCandidates = (data?.users ?? []).filter((user) => {
      if (user.status !== "active" || user.role === "admin") {
        return false;
      }

      return user.role !== "manager";
    });

    setAssignUserId(defaultCandidates[0]?.id ?? "");
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setAssignTargetBuilding(null);
    setAssignError(null);
    setIsAssigning(false);
  };

  const saveAssignUser = async () => {
    if (!token || !assignTargetBuilding || !assignUserId) return;

    try {
      setIsAssigning(true);
      setAssignError(null);
      await assignBuildingMember(
        token,
        assignTargetBuilding.backendId || assignTargetBuilding.id,
        {
          userId: assignUserId,
          role: assignRole,
        },
      );
      await refresh();
      if (selectedBuildingDetail) {
        const refreshedMembers = await getBuildingMembers(
          token,
          selectedBuildingDetail.backendId || selectedBuildingDetail.id,
        );
        setBuildingMembers(refreshedMembers);
      }
      closeAssignModal();
    } catch (err) {
      setAssignError(
        err instanceof Error
          ? err.message
          : "Unable to assign user to building",
      );
      setIsAssigning(false);
    }
  };

  const removeBuildingById = async (building: Building) => {
    if (!token) return;
    setPendingDeleteBuilding(building);
  };

  const confirmRemoveBuilding = async () => {
    if (!token || !pendingDeleteBuilding) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await deleteBuilding(
        token,
        pendingDeleteBuilding.backendId || pendingDeleteBuilding.id,
      );
      await refresh();
      setPendingDeleteBuilding(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to delete building",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ---------- Create User handlers ----------

  const openCreateUserModal = () => {
    setUserActionError(null);
    setUserForm({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      role: "user",
    });
    setIsCreatingUser(true);
  };

  const closeCreateUserModal = () => {
    setIsCreatingUser(false);
    setUserActionError(null);
    setIsSavingUser(false);
  };

  const saveCreateUser = async () => {
    if (!token) return;
    try {
      setIsSavingUser(true);
      setUserActionError(null);
      await createAdminUser(token, {
        fullName: userForm.fullName,
        email: userForm.email,
        password: userForm.password,
        phone: userForm.phone,
        role: userForm.role,
      });
      await refresh();
      closeCreateUserModal();
    } catch (err) {
      setUserActionError(
        err instanceof Error ? err.message : "Unable to create user",
      );
      setIsSavingUser(false);
    }
  };

  // ---------- Table ----------

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DataColumn<Building>[] = [
    {
      key: "name",
      title: "Building name",
      render: (row) => (
        <button
          type="button"
          className="text-left font-semibold text-primary transition hover:underline"
          onClick={() => openBuildingMembersModal(row)}
        >
          {row.name}
        </button>
      ),
    },
    { key: "address", title: "Address" },
    { key: "floors", title: "Floors" },
    {
      key: "occupancyRate",
      title: "Occupancy rate",
      render: (row) => (
        <div className="w-32">
          <div className="mb-1 text-xs text-muted-foreground">
            {row.occupancyRate}%
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${row.occupancyRate}%` }}
            />
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
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleBuildingStatus(row)}
          >
            {row.status === "active" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openAssignModal(row)}
          >
            Assign
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeBuildingById(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      {actionError ? (
        <div className="text-sm text-red-600">{actionError}</div>
      ) : null}

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
          filterOptions={[
            "all",
            "active",
            "inactive",
            "maintenance",
            "warning",
          ]}
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openCreateUserModal}>
            Create user
          </Button>
          <Button onClick={openCreateModal}>Create building</Button>
        </div>
      </div>

      <DataTable title="Buildings" rows={pageRows} columns={columns} />

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} / {maxPage}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
        >
          Next
        </Button>
      </div>

      {/* Building modal */}
      <ModalForm
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        title={selectedBuilding ? "Edit building" : "Create building"}
        onSubmit={saveBuilding}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Building name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <Input
            placeholder="Building code"
            value={form.code}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, code: e.target.value }))
            }
          />
          <Input
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, address: e.target.value }))
            }
          />
          <Input
            placeholder="Floors"
            value={form.floors}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, floors: e.target.value }))
            }
          />
          {!selectedBuilding ? (
            <Input
              placeholder="Hourly rate (VND)"
              value={form.hourlyRate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, hourlyRate: e.target.value }))
              }
            />
          ) : null}
        </div>
        {isSaving ? (
          <p className="text-xs text-muted-foreground">Saving...</p>
        ) : null}
      </ModalForm>

      <Modal
        open={Boolean(selectedBuildingDetail)}
        onOpenChange={(open) => {
          if (!open) closeBuildingMembersModal();
        }}
        title={
          selectedBuildingDetail
            ? `Building members - ${selectedBuildingDetail.name}`
            : "Building members"
        }
      >
        <div className="grid gap-5 text-sm text-slate-200">
          {membersError ? <p className="text-red-400">{membersError}</p> : null}
          {isLoadingMembers ? (
            <p className="text-slate-400">Loading building members...</p>
          ) : (
            <>
              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-300">
                    Manager
                  </h3>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    Single slot
                  </span>
                </div>
                {buildingMembers?.manager ? (
                  <div className="grid gap-1.5">
                    <p className="text-base font-semibold text-white">
                      {buildingMembers.manager.fullName}
                    </p>
                    <p className="text-slate-400">
                      {buildingMembers.manager.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      Role: {buildingMembers.manager.role}
                      {buildingMembers.manager.phone
                        ? ` · ${buildingMembers.manager.phone}`
                        : ""}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400">No manager assigned.</p>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-300">
                    Staff
                  </h3>
                  <span className="rounded-full bg-sky-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300">
                    {buildingMembers?.staff.length ?? 0} members
                  </span>
                </div>
                {buildingMembers?.staff?.length ? (
                  <div className="grid gap-3">
                    {buildingMembers.staff.map((staff) => (
                      <div
                        key={staff._id}
                        className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-white">
                              {staff.fullName}
                            </p>
                            <p className="text-slate-400">{staff.email}</p>
                            <p className="text-xs text-slate-500">
                              Role: {staff.role}
                              {staff.phone ? ` · ${staff.phone}` : ""}
                            </p>
                          </div>
                          <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                            Assigned staff
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No staff assigned.</p>
                )}
              </section>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={isAssignModalOpen}
        onOpenChange={(open) => {
          if (!open) closeAssignModal();
        }}
        title={
          assignTargetBuilding
            ? `Assign user - ${assignTargetBuilding.name}`
            : "Assign user"
        }
        className="max-w-4xl"
      >
        <div className="grid gap-5 text-sm text-slate-200">
          {assignError ? <p className="text-red-400">{assignError}</p> : null}
          <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
            <label className="grid gap-2 md:max-w-[220px]">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Assignment type
              </span>
              <AssignDropdown
                value={assignRole}
                onChange={setAssignRole}
                placeholder="Select role"
                options={ASSIGN_ROLE_OPTIONS}
                displayValue={(option) => option.label}
                optionClassName={(selected) =>
                  `flex w-full items-center rounded-[1.1rem] px-4 py-3 text-left text-[1rem] transition-all duration-150 ${selected ? "bg-[#e8efff] text-[#2f62e0]" : "text-slate-800 hover:bg-slate-200"}`
                }
                menuClassName="bg-white"
              />
              <span className="text-xs text-slate-500">
                {
                  ASSIGN_ROLE_OPTIONS.find(
                    (option) => option.value === assignRole,
                  )?.hint
                }
              </span>
            </label>

            <label className="grid gap-2 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                User
              </span>
              <AssignDropdown
                value={assignUserId}
                onChange={setAssignUserId}
                placeholder="Select user"
                options={
                  assignableUsers.length > 0
                    ? assignableUsers.map((user) => ({
                        value: user.id,
                        label: user.name,
                        description: `${user.role} · ${user.email}`,
                      }))
                    : [
                        {
                          value: "",
                          label: "No eligible users",
                        },
                      ]
                }
                displayValue={(option) =>
                  option.description
                    ? `${option.label} · ${option.description}`
                    : option.label
                }
                optionClassName={(selected) =>
                  `flex w-full items-center rounded-[1.1rem] px-4 py-3 text-left text-[1rem] transition-all duration-150 ${selected ? "bg-[#e8efff] text-[#2f62e0]" : "text-slate-800 hover:bg-slate-200"}`
                }
                menuClassName="bg-white"
              />
              <span className="text-xs text-slate-500">
                Admin accounts are excluded. Active only.
              </span>
            </label>
          </div>

          {assignableUsers.length === 0 ? (
            <p className="text-slate-400">
              No eligible users are available for the selected assignment type.
            </p>
          ) : null}

          <div className="flex justify-end gap-2.5 border-t border-white/10 pt-4">
            <Button
              variant="secondary"
              onClick={() => closeAssignModal()}
              className="rounded-xl px-5 py-2 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={saveAssignUser}
              disabled={
                isAssigning || assignableUsers.length === 0 || !assignUserId
              }
              className="rounded-xl px-5 py-2 font-bold text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/10 transition-all duration-200 hover:scale-[1.01]"
            >
              {isAssigning ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create user modal */}
      <ModalForm
        open={isCreatingUser}
        onOpenChange={(open) => {
          if (!open) closeCreateUserModal();
        }}
        title="Create user"
        onSubmit={saveCreateUser}
      >
        {userActionError ? (
          <p className="text-sm text-red-600">{userActionError}</p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Full name"
            value={userForm.fullName}
            onChange={(e) =>
              setUserForm((prev) => ({ ...prev, fullName: e.target.value }))
            }
          />
          <Input
            placeholder="Email"
            value={userForm.email}
            onChange={(e) =>
              setUserForm((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <Input
            placeholder="Password"
            type="password"
            value={userForm.password}
            onChange={(e) =>
              setUserForm((prev) => ({ ...prev, password: e.target.value }))
            }
          />
          <Input
            placeholder="Phone"
            value={userForm.phone}
            onChange={(e) =>
              setUserForm((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
          <RoleDropdown
            value={userForm.role}
            onChange={(role) => setUserForm((prev) => ({ ...prev, role }))}
          />
        </div>
        {isSavingUser ? (
          <p className="text-xs text-muted-foreground">Creating...</p>
        ) : null}
      </ModalForm>

      <ConfirmModal
        open={Boolean(pendingDeleteBuilding)}
        title="Confirm building deletion"
        description={`Are you sure you want to delete building ${pendingDeleteBuilding?.name || ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteBuilding(null);
        }}
        onConfirm={confirmRemoveBuilding}
      />
    </div>
  );
}
