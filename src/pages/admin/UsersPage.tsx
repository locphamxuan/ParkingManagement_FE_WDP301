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

// Only user‑role accounts are managed here.
// Staff / manager assignment is done via Buildings → Members.
const ROLE_OPTIONS: Array<{ value: 'admin' | 'manager' | 'staff' | 'user'; label: string }> = [
  { value: "user",    label: "User" },
  { value: "staff",   label: "Staff"   },
  { value: "manager", label: "Manager" },
];

function RoleDropdown({
  value,
  onChange,
}: {
  value: 'admin' | 'manager' | 'staff' | 'user';
  onChange: (value: 'admin' | 'manager' | 'staff' | 'user') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const currentLabel = ROLE_OPTIONS.find((o) => o.value === value)?.label ?? "User";

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
        <span className="-translate-y-[2px] text-xl leading-none text-muted-foreground">›</span>
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
                  onClick={() => { onChange(option.value); setIsOpen(false); }}
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
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [pendingLockUser, setPendingLockUser] = useState<UserRecord | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "user" as 'admin' | 'manager' | 'staff' | 'user',
    buildingId: "",
  });

  // Derive building list from the already‑loaded dataset
  const buildings = useMemo(
    () => data?.buildings ?? [],
    [data?.buildings],
  );

  // Only show "user" role accounts on this page.
  // Staff / manager are managed via building assignment.
  const filtered = useMemo(() => {
    const source = (data?.users ?? []).filter((u) => u.role === "user");
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.linkedPlates.some((plate) => plate.toLowerCase().includes(q)),
    );
  }, [data?.users, query]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || "Failed to load users."}</div>;
  }

  const token = session?.token || "";

  const openCreateModal = () => {
    setActionError(null);
    setForm({ fullName: "", email: "", password: "", phone: "", role: "user", buildingId: "" });
    setIsCreating(true);
  };

  const openEditModal = (user: UserRecord) => {
    setActionError(null);
    setForm({
      fullName: user.name,
      email: user.email,
      password: "",
      phone: user.phone || "",
      role: user.role,
      buildingId: "",
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

    // Validate: manager / staff must have a building selected
    if ((form.role === "manager" || form.role === "staff") && !form.buildingId) {
      setActionError(
        `A building must be selected when creating a ${form.role} account.`,
      );
      return;
    }

    // Validate required fields
    if (!form.fullName.trim()) {
      setActionError("Full name is required.");
      return;
    }
    if (!form.email.trim()) {
      setActionError("Email is required.");
      return;
    }
    if (!form.password.trim()) {
      setActionError("Password is required.");
      return;
    }

    try {
      setIsSaving(true);
      setActionError(null);
      await createAdminUser(token, {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
        buildingId: form.buildingId || undefined,
      });
      await refresh();
      closeModals();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to create user");
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
      });
      await refresh();
      closeModals();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to update user");
      setIsSaving(false);
    }
  };

  const toggleStatus = async (user: UserRecord) => {
    if (!token) return;
    // Show confirm before locking
    if (user.status === "active") {
      setPendingLockUser(user);
      return;
    }
    try {
      await updateAdminUserStatus(token, user.id, true);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to change user status");
    }
  };

  const confirmLock = async () => {
    if (!token || !pendingLockUser) return;
    try {
      await updateAdminUserStatus(token, pendingLockUser.id, false);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to lock user");
    } finally {
      setPendingLockUser(null);
    }
  };

  const confirmDelete = async () => {
    if (!token || !pendingDeleteUser) return;
    try {
      setIsDeleting(true);
      await deleteAdminUser(token, pendingDeleteUser.id);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to delete user");
    } finally {
      setIsDeleting(false);
      setPendingDeleteUser(null);
    }
  };

  const columns: DataColumn<UserRecord>[] = [
    { key: "name",  title: "Name"  },
    { key: "email", title: "Email" },
    { key: "phone", title: "Phone", render: (row) => row.phone || "—" },
    {
      key: "status",
      title: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "walletBalance",
      title: "Wallet",
      render: (row) => `${row.walletBalance.toLocaleString()} VND`,
    },
    {
      key: "linkedPlates",
      title: "Plates",
      render: (row) =>
        row.linkedPlates.length === 0 ? (
          <span className="text-xs italic text-muted-foreground">None</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.linkedPlates.map((p) => (
              <span
                key={p}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold"
              >
                {p}
              </span>
            ))}
          </div>
        ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toggleStatus(row)}>
            {row.status === "active" ? "Lock" : "Unlock"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setPendingDeleteUser(row)}
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

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Showing <strong>user</strong> accounts only. Staff & manager accounts are managed via
          Buildings → Members.
        </p>
        <Button onClick={openCreateModal}>Create user</Button>
      </div>

      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        filterValue="user"
        onFilterChange={() => undefined}
        filterOptions={["user"]}
      />

      <DataTable title="Users" rows={filtered} columns={columns} />

      {/* ── Edit Modal ─────────────────────────────────────── */}
      <ModalForm
        open={Boolean(selectedUser)}
        onOpenChange={(open) => { if (!open) closeModals(); }}
        title="Edit user"
        onSubmit={saveUpdate}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          />
          <Input placeholder="Email" value={form.email} disabled />
          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        {isSaving ? <p className="text-xs text-muted-foreground">Saving...</p> : null}
      </ModalForm>

      {/* ── Create Modal ───────────────────────────────────── */}
      <ModalForm
        open={isCreating}
        onOpenChange={(open) => { if (!open) closeModals(); }}
        title="Create user"
        onSubmit={saveCreate}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <Input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs uppercase text-muted-foreground">Role</label>
            <RoleDropdown
              value={form.role}
              onChange={(role) => setForm((prev) => ({ ...prev, role, buildingId: "" }))}
            />
          </div>

          {/* Building selector — shown only for staff / manager */}
          {(form.role === "staff" || form.role === "manager") ? (
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs uppercase text-muted-foreground">
                Assign to building <span className="text-red-500">*</span>
              </label>
              <select
                value={form.buildingId}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, buildingId: e.target.value }));
                  setActionError(null);
                }}
                className={`h-10 w-full rounded-[1.2rem] border px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring bg-secondary ${
                  !form.buildingId && actionError
                    ? "border-red-500 focus:ring-red-300"
                    : "border-border"
                }`}
              >
                <option value="">— Select building —</option>
                {buildings.map((b) => (
                  <option key={b.backendId || b.id} value={b.backendId || b.id}>
                    {b.name} ({b.id})
                  </option>
                ))}
              </select>
              {!form.buildingId && actionError?.includes("building") ? (
                <p className="mt-1 text-xs text-red-500">
                  Please select a building.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        {actionError && isCreating ? (
          <p className="mt-1 text-sm text-red-600">{actionError}</p>
        ) : null}
        {isSaving ? <p className="text-xs text-muted-foreground">Creating...</p> : null}
      </ModalForm>

      {/* ── Lock Confirm ───────────────────────────────────── */}
      <ConfirmModal
        open={Boolean(pendingLockUser)}
        title="Lock user account"
        description={`Lock account ${pendingLockUser?.email || ""}? The user will not be able to log in.`}
        confirmLabel="Lock"
        isConfirming={false}
        onOpenChange={(open) => { if (!open) setPendingLockUser(null); }}
        onConfirm={confirmLock}
      />

      {/* ── Delete Confirm ─────────────────────────────────── */}
      <ConfirmModal
        open={Boolean(pendingDeleteUser)}
        title="Delete user account"
        description={`Permanently delete account "${pendingDeleteUser?.name || pendingDeleteUser?.email || ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onOpenChange={(open) => { if (!open) setPendingDeleteUser(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
