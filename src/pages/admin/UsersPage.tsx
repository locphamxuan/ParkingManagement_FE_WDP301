import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Lock, Mail, Phone, Plus, Search, Trash2, Unlock, Users, UserCheck, UserX, Wallet } from 'lucide-react';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { ModalForm } from '@/components/modals/ModalForm';
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
    // Tab Người dùng chỉ quản lý tài khoản khách (role === 'user').
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

  const stats = useMemo(() => {
    // calculate stats based on role user list
    const source = (data?.users ?? []).filter((user) => user.role === 'user');
    const total = source.length;
    const active = source.filter((u) => u.status === 'active').length;
    const blocked = source.filter((u) => u.status === 'blocked').length;
    const totalBalance = source.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
    return { total, active, blocked, totalBalance };
  }, [data?.users]);

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
    try {
      setIsSaving(true);
      setActionError(null);
      await createAdminUser({
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
      setActionError(err instanceof Error ? err.message : 'Unable to create user');
      setIsSaving(false);
    }
  };

  const saveUpdate = async () => {
    if (!token || !selectedUser) return;
    try {
      setIsSaving(true);
      setActionError(null);
      await updateAdminUser(selectedUser.id, {
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
      await updateAdminUserStatus(user.id, user.status !== 'active');
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
      await deleteAdminUser(pendingDeleteUser.id);
      await refresh();
      setPendingDeleteUser(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {actionError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-bold text-rose-600 shadow-sm animate-in fade-in duration-200">
          {actionError}
        </div>
      ) : null}

      {/* Analytics Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="relative overflow-hidden rounded-2xl glass-premium p-4 shadow-sm border border-sky-100/60 bg-white/45 flex items-center gap-4 group hover:border-blue-500/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/30 to-indigo-500/10" />
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total customers</p>
            <p className="text-base font-black text-slate-800 mt-0.5">{stats.total}</p>
          </div>
        </div>
        
        {/* Active Users */}
        <div className="relative overflow-hidden rounded-2xl glass-premium p-4 shadow-sm border border-sky-100/60 bg-white/45 flex items-center gap-4 group hover:border-emerald-500/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/10 via-emerald-500/30 to-teal-500/10" />
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <UserCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active</p>
            <p className="text-base font-black text-slate-800 mt-0.5">{stats.active}</p>
          </div>
        </div>

        {/* Blocked Users */}
        <div className="relative overflow-hidden rounded-2xl glass-premium p-4 shadow-sm border border-sky-100/60 bg-white/45 flex items-center gap-4 group hover:border-rose-500/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500/10 via-rose-500/30 to-red-500/10" />
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <UserX size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Locked accounts</p>
            <p className="text-base font-black text-slate-800 mt-0.5">{stats.blocked}</p>
          </div>
        </div>

        {/* Total Wallet Balance */}
        <div className="relative overflow-hidden rounded-2xl glass-premium p-4 shadow-sm border border-sky-100/60 bg-white/45 flex items-center gap-4 group hover:border-amber-500/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/10 via-amber-500/30 to-orange-500/10" />
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total wallet balance</p>
            <p className="text-base font-black text-slate-800 mt-0.5">{stats.totalBalance.toLocaleString('vi-VN')} ₫</p>
          </div>
        </div>
      </div>

      {/* Control Actions Row (Search, filter, create button) grouped together beautifully */}
      <div className="flex flex-col md:flex-row items-center gap-3 w-full rounded-2xl border border-sky-100/60 bg-white/45 p-3 shadow-sm backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Search customers by name, email or plate..."
            className="h-11 w-full rounded-xl border-sky-100 bg-white/90 pl-9 text-xs font-semibold focus-visible:ring-blue-500"
          />
        </div>

        {/* Status Filter Dropdown */}
        <CustomSelect
          className="h-11 w-full md:w-48 shrink-0"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'blocked', label: 'Locked' },
            { value: 'pending', label: 'Pending' },
          ]}
        />

        {/* Create User Gem Button */}
        <Button 
          onClick={openCreateModal}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-white rounded-xl font-black px-5 py-2.5 h-11 text-xs border-0 shadow-md flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-center"
        >
          <Plus size={14} /> Create user
        </Button>
      </div>

      {/* Premium User Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl glass-premium border border-sky-100/80 p-12 text-center text-slate-500 italic">
          No customers found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((u) => {
            const hasPhone = !!u.phone && u.phone !== 'Not updated';
            const plates = u.linkedPlates || [];
            return (
              <motion.div
                key={u.id}
                whileHover={{ scale: 1.01, y: -4 }}
                className="relative overflow-hidden rounded-3xl glass-premium p-6 shadow-md border border-sky-100/85 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(37,99,235,0.06)] hover:border-blue-500/25 group bg-white/40"
              >
                {/* Crystal Bevel Border */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />

                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-black border border-blue-500/20 shadow-sm shrink-0 uppercase">
                      {u.name.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{u.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{u.role || 'user'}</p>
                    </div>
                  </div>
                  <StatusBadge status={u.status} />
                </div>

                {/* Card Info Details */}
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <Mail size={13} className="text-slate-500 shrink-0" />
                    <span className="text-xs text-slate-600 truncate max-w-[200px] block">
                      {u.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <Phone size={13} className={hasPhone ? 'text-slate-500 shrink-0' : 'text-slate-400 shrink-0'} />
                    <span className={`text-xs ${hasPhone ? 'text-slate-600 font-bold' : 'italic text-slate-400 font-medium'}`}>
                      {u.phone || 'Not updated'}
                    </span>
                  </div>
                </div>

                {/* Wallet Balance Section */}
                <div className="mt-4 pt-4 border-t border-sky-100/40 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wallet balance</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg inline-block shadow-sm">
                    {u.walletBalance.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                {/* Linked Plates Container */}
                <div className="mt-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Linked plates ({plates.length})</p>
                  {plates.length === 0 ? (
                    <span className="text-slate-400 italic text-xs font-medium">Not linked</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      {plates.map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center px-2 py-0.5 rounded border border-blue-500/25 bg-white text-slate-700 font-mono text-[10px] font-black tracking-wider shadow-sm"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3.5 border-t border-sky-100/40 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEditModal(u)}
                    aria-label={`Edit ${u.name}`}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600 transition-all duration-200 hover:bg-amber-500 hover:text-white hover:shadow-md hover:shadow-amber-500/10"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => toggleStatus(u)}
                    aria-label={`${u.status === 'active' ? 'Lock' : 'Unlock'} ${u.name}`}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-600 transition-all duration-200 hover:bg-orange-500 hover:text-white hover:shadow-md hover:shadow-orange-500/10"
                    title={u.status === 'active' ? 'Lock account' : 'Unlock'}
                  >
                    {u.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <button
                    onClick={() => setPendingDeleteUser(u)}
                    aria-label={`Delete ${u.name}`}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-all duration-200 hover:bg-red-500 hover:text-white hover:shadow-md hover:shadow-red-500/10"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

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
                { value: 'user', label: 'User' },
                { value: 'staff', label: 'Staff' },
                { value: 'manager', label: 'Manager' }
              ]}
            />
          </div>
          {(form.role === 'staff' || form.role === 'manager') && (
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Assigned building <span className="text-red-500">*</span>
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
            {form.role === 'staff' ? 'Staff' : 'Manager'} will be assigned to the selected building on creation.
            This account type is not shown in the “Users” list.
          </p>
        )}
        {isSaving ? <p className="text-xs text-muted-foreground">Creating...</p> : null}
      </ModalForm>

      <ConfirmModal
        open={Boolean(pendingDeleteUser)}
        title="Confirm delete user"
        description={`Permanently delete account "${pendingDeleteUser?.name || pendingDeleteUser?.email || ''}"? This action cannot be undone.`}
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
