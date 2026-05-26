import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { DataTable, type DataColumn } from "@/components/shared/DataTable";
import { ModalForm } from "@/components/shared/ModalForm";
import { SearchFilterBar } from "@/components/shared/SearchFilterBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminDataset } from "@/hooks/admin/useAdminDataset";
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
  updateAdminUserStatus,
} from "@/services/admin/adminCrud";
import { useAuth } from "@/hooks/useAuth";
import type { UserRecord } from "@/types";

const ROLE_OPTIONS: Array<{ value: UserRecord["role"]; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
  { value: "user", label: "User" },
];

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

export function UsersPage() {
  const { data, isLoading, error, refresh } = useAdminDataset();
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserRecord | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "user" as UserRecord["role"],
  });

  const filtered = useMemo(() => {
    const source = data?.users ?? [];

    return source.filter((user) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.linkedPlates.some((plate) => plate.toLowerCase().includes(q));
      const matchRole = roleFilter === "all" || user.role === roleFilter;
      return matchQuery && matchRole;
    });
  }, [data?.users, query, roleFilter]);

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading users...</div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-600">
        {error || "Failed to load users."}
      </div>
    );
  }

  const token = session?.token || "";


  const openEditModal = (user: UserRecord) => {
    setActionError(null);
    setForm({
      fullName: user.name,
      email: user.email,
      password: "",
      phone: user.phone || "",
      role: user.role,
    });
    setSelectedUser(user);
  };

  const closeModals = () => {
    setIsCreating(false);
    setSelectedUser(null);
    setActionError(null);
    setIsSaving(false);
  };

  const saveCreate = async () => {
    if (!token) return;
    try {
      setIsSaving(true);
      setActionError(null);
      await createAdminUser(token, {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
      });
      await refresh();
      closeModals();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to create user",
      );
      setIsSaving(false);
    }
  };

  const saveUpdate = async () => {
    if (!token || !selectedUser) return;
    try {
      setIsSaving(true);
      setActionError(null);
      await updateAdminUser(token, selectedUser.id, {
        fullName: form.fullName,
        phone: form.phone,
        role: form.role,
      });
      await refresh();
      closeModals();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to update user",
      );
      setIsSaving(false);
    }
  };

  const toggleStatus = async (user: UserRecord) => {
    if (!token) return;
    try {
      setActionError(null);
      await updateAdminUserStatus(token, user.id, user.status !== "active");
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to change user status",
      );
    }
  };

  const removeUser = async (user: UserRecord) => {
    if (!token) return;
    setPendingDeleteUser(user);
  };

  const confirmRemoveUser = async () => {
    if (!token || !pendingDeleteUser) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await deleteAdminUser(token, pendingDeleteUser.id);
      await refresh();
      setPendingDeleteUser(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to delete user",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataColumn<UserRecord>[] = [
    { key: "name", title: "User" },
    { key: "email", title: "Email" },
    {
      key: "phone",
      title: "Phone",
      render: (row) => row.phone || "Not updated",
    },
    {
      key: "role",
      title: "Role",
      render: (row) => <StatusBadge status={row.role} />,
    },
    {
      key: "status",
      title: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "walletBalance",
      title: "Wallet balance",
      render: (row) => `${row.walletBalance.toLocaleString()} VND`,
    },
    {
      key: "linkedPlates",
      title: "Linked plates",
      render: (row) => {
        const locallyUpdatedRaw = localStorage.getItem(
          "pbms.locallyUpdatedUsers",
        );
        const locallyUpdated = locallyUpdatedRaw
          ? JSON.parse(locallyUpdatedRaw)
          : {};

        // Case-insensitive and trimmed lookup
        const targetEmail = (row.email || "").trim().toLowerCase();
        const matchingKey = Object.keys(locallyUpdated).find(
          (key) => key.trim().toLowerCase() === targetEmail,
        );
        const localUser = matchingKey ? locallyUpdated[matchingKey] : null;

        // Retrieve plates from simulated localStorage user registry if available
        const localPlates: Array<{
          plateNumber: string;
          vehicleType: "car" | "motorcycle";
          isDefault?: boolean;
        }> = localUser?.licensePlates || [];

        // Build a unique plate map to merge both sets preserving type and default status
        const plateMap = new Map<
          string,
          { vehicleType: "car" | "motorcycle"; isDefault?: boolean }
        >();

        // Load local updates
        localPlates.forEach((p) => {
          if (p.plateNumber) {
            plateMap.set(p.plateNumber.toUpperCase(), {
              vehicleType: p.vehicleType,
              isDefault: p.isDefault,
            });
          }
        });

        // Merge with row.linkedPlates (defaulting to car if type is unspecified)
        (row.linkedPlates || []).forEach((p) => {
          const upper = p.toUpperCase();
          if (!plateMap.has(upper)) {
            plateMap.set(upper, { vehicleType: "car", isDefault: false });
          }
        });

        const mergedPlates = Array.from(plateMap.entries()).map(
          ([plateNumber, info]) => ({
            plateNumber,
            vehicleType: info.vehicleType,
            isDefault: info.isDefault,
          }),
        );

        if (mergedPlates.length === 0) {
          return (
            <span className="text-muted-foreground italic text-xs">
              Not linked
            </span>
          );
        }

        return (
          <div className="flex flex-wrap gap-1.5">
            {mergedPlates.map((p) => (
              <span
                key={p.plateNumber}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-black border tracking-wider transition-all duration-200 ${
                  p.isDefault
                    ? "bg-amber-500/20 border-amber-500/30 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                    : p.vehicleType === "car"
                      ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                      : "bg-purple-500/20 border-purple-500/30 text-purple-400"
                }`}
                title={
                  p.isDefault
                    ? "Default plate"
                    : p.vehicleType === "car"
                      ? "Car"
                      : "Motorcycle"
                }
              >
                <span>{p.vehicleType === "car" ? "🚗" : "🏍️"}</span>
                <span>{p.plateNumber}</span>
                {p.isDefault && (
                  <span className="text-[8px] font-sans font-extrabold uppercase tracking-normal opacity-95">
                    (Default)
                  </span>
                )}
              </span>
            ))}
          </div>
        );
      },
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
            onClick={() => toggleStatus(row)}
          >
            {row.status === "active" ? "Lock" : "Unlock"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => removeUser(row)}>
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

      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        filterValue={roleFilter}
        onFilterChange={setRoleFilter}
        filterOptions={["all", "admin", "manager", "staff", "user"]}
      />

      <DataTable title="Users" rows={filtered} columns={columns} />

      <ModalForm
        open={Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) closeModals();
        }}
        title="Update user"
        onSubmit={saveUpdate}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, fullName: e.target.value }))
            }
          />
          <Input placeholder="Email" value={form.email} disabled />
          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
          <RoleDropdown
            value={form.role}
            onChange={(role) =>
              setForm((prev) => ({
                ...prev,
                role,
              }))
            }
          />
        </div>
        {isSaving ? (
          <p className="text-xs text-muted-foreground">Saving...</p>
        ) : null}
      </ModalForm>

      <ModalForm
        open={isCreating}
        onOpenChange={(open) => {
          if (!open) closeModals();
        }}
        title="Create user"
        onSubmit={saveCreate}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, fullName: e.target.value }))
            }
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
          />
          <Input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
          />
          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
          <RoleDropdown
            value={form.role}
            onChange={(role) =>
              setForm((prev) => ({
                ...prev,
                role,
              }))
            }
          />
        </div>
        {isSaving ? (
          <p className="text-xs text-muted-foreground">Creating...</p>
        ) : null}
      </ModalForm>

      <ConfirmModal
        open={Boolean(pendingDeleteUser)}
        title="Confirm user deletion"
        description={`Are you sure you want to delete user ${pendingDeleteUser?.email || ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteUser(null);
        }}
        onConfirm={confirmRemoveUser}
      />
    </div>
  );
}
