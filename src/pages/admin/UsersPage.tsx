import { useMemo, useState } from 'react';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { ModalForm } from '@/components/modals/ModalForm';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/select';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
  updateAdminUserStatus,
} from '@/services/admin/adminCrud';
import { useAuth } from '@/hooks/useAuth';
import type { UserRecord } from '@/types';

export function UsersPage() {
  const { data, isLoading, error, refresh } = useAdminDataset();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState<{
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: 'user' | 'staff' | 'manager' | 'admin';
    buildingId: string;
  }>({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    buildingId: '',
  });

  const filtered = useMemo(() => {
    // The Users tab only manages customer accounts (role === 'user').
    const source = (data?.users ?? []).filter((user) => user.role === 'user');
    return source.filter((user) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.linkedPlates.some((plate) => plate.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [data?.users, query, statusFilter]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Failed to load users.'}</div>;
  }

  const token = session?.token || '';

  const openCreateModal = () => {
    setActionError(null);
    setForm({ fullName: '', email: '', password: '', phone: '', role: 'user', buildingId: '' });
    setIsCreating(true);
  };

  const openEditModal = (user: UserRecord) => {
    setActionError(null);
    setForm({
      fullName: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role,
      buildingId: '',
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
    const needsBuilding = form.role === 'staff' || form.role === 'manager';
    if (needsBuilding && !form.buildingId) {
      setActionError('Please select a building for the staff / manager.');
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
        buildingId: needsBuilding ? form.buildingId : undefined,
      });
      await refresh();
      closeModals();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to create user');
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
      setActionError(err instanceof Error ? err.message : 'Unable to update user');
      setIsSaving(false);
    }
  };

  const toggleStatus = async (user: UserRecord) => {
    if (!token) return;
    try {
      setActionError(null);
      await updateAdminUserStatus(token, user.id, user.status !== 'active');
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to change user status');
    }
  };

  const confirmDeleteUser = async () => {
    if (!token || !pendingDeleteUser) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await deleteAdminUser(token, pendingDeleteUser.id);
      await refresh();
      setPendingDeleteUser(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataColumn<UserRecord>[] = [
    { key: 'name', title: 'Full name' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Phone number', render: (row) => row.phone || 'Not updated' },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'walletBalance',
      title: 'Wallet balance',
      render: (row) => `${row.walletBalance.toLocaleString('vi-VN')} ₫`,
    },
    {
      key: 'linkedPlates',
      title: 'Linked plates',
      render: (row) => {
        const locallyUpdatedRaw = localStorage.getItem('pbms.locallyUpdatedUsers');
        const locallyUpdated = locallyUpdatedRaw ? JSON.parse(locallyUpdatedRaw) : {};
        const targetEmail = (row.email || '').trim().toLowerCase();
        const matchingKey = Object.keys(locallyUpdated).find(
          (key) => key.trim().toLowerCase() === targetEmail,
        );
        const localUser = matchingKey ? locallyUpdated[matchingKey] : null;
        const localPlates: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle'; isDefault?: boolean }> =
          localUser?.licensePlates || [];

        const plateMap = new Map<string, { vehicleType: 'car' | 'motorcycle'; isDefault?: boolean }>();
        localPlates.forEach((p) => {
          if (p.plateNumber) {
            plateMap.set(p.plateNumber.toUpperCase(), { vehicleType: p.vehicleType, isDefault: p.isDefault });
          }
        });
        (row.linkedPlates || []).forEach((p) => {
          const upper = p.toUpperCase();
          if (!plateMap.has(upper)) {
            plateMap.set(upper, { vehicleType: 'car', isDefault: false });
          }
        });

        const mergedPlates = Array.from(plateMap.entries()).map(([plateNumber, info]) => ({
          plateNumber,
          vehicleType: info.vehicleType,
          isDefault: info.isDefault,
        }));

        if (mergedPlates.length === 0) {
          return <span className="text-muted-foreground italic text-xs">Not linked</span>;
        }

        return (
          <div className="flex flex-wrap gap-1.5">
            {mergedPlates.map((p) => (
              <span
                key={p.plateNumber}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-black border tracking-wider ${
                  p.isDefault
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-500'
                    : p.vehicleType === 'car'
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    : 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                }`}
                title={p.isDefault ? 'Default plate' : p.vehicleType === 'car' ? 'Car' : 'Motorcycle'}
              >
                <span>{p.vehicleType === 'car' ? '🚗' : '🏍️'}</span>
                <span>{p.plateNumber}</span>
                {p.isDefault && (
                  <span className="text-[8px] font-sans font-extrabold uppercase tracking-normal opacity-95">(Default)</span>
                )}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
            Sửa
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toggleStatus(row)}>
            {row.status === 'active' ? 'Lock' : 'Open'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPendingDeleteUser(row)}>Delete</Button>
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
          onQueryChange={setQuery}
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={['all', 'active', 'blocked', 'pending']}
        />
        <Button onClick={openCreateModal}>Create user</Button>
      </div>

      <DataTable title="Users" rows={filtered} columns={columns} />

      {/* Edit User Modal */}
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
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          />
          <Input placeholder="Email" value={form.email} disabled />
          <Input
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        {isSaving ? <p className="text-xs text-muted-foreground">Saving...</p> : null}
      </ModalForm>

      {/* Create User Modal */}
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
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <div className="grid gap-1.5">
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Role</label>
            <CustomSelect
              className="h-10"
              value={form.role}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, role: val as typeof prev.role, buildingId: '' }))
              }
              options={[
                { value: 'user', label: 'Users' },
                { value: 'staff', label: 'Staff' },
                { value: 'manager', label: 'Management' }
              ]}
            />
          </div>
          {(form.role === 'staff' || form.role === 'manager') && (
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Assigned building<span className="text-red-500">*</span>
              </label>
              <CustomSelect
                className="h-10"
                value={form.buildingId}
                onChange={(val) => setForm((prev) => ({ ...prev, buildingId: val }))}
                placeholder="-- Select building --"
                options={[
                  { value: '', label: '-- Select building --' },
                  ...(data?.buildings ?? []).map((b) => ({
                    value: b.backendId || b.id,
                    label: b.name
                  }))
                ]}
              />
            </div>
          )}
        </div>
        {(form.role === 'staff' || form.role === 'manager') && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {form.role === 'staff' ? 'Staff' : 'Management'} will be assigned to the selected building upon creation.
            Accounts of this type do not appear in the "Users" list.
          </p>
        )}
        {isSaving ? <p className="text-xs text-muted-foreground">Creating...</p> : null}
      </ModalForm>

      <ConfirmModal
        open={Boolean(pendingDeleteUser)}
        title="Confirm user deletion"
        description={`Permanently delete the account "${pendingDeleteUser?.name || pendingDeleteUser?.email || ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteUser(null);
        }}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
}
