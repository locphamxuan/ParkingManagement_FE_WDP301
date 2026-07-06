import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Lock, Mail, Phone, Plus, Search, Trash2, Unlock, User, Users, UserCheck, UserX, Wallet } from 'lucide-react';
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
    const blocked = source.filter((u) => u.status === 'blocked' || u.status === 'inactive').length;
    const totalBalance = source.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
    return { total, active, blocked, totalBalance };
  }, [data?.users]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải danh sách người dùng...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Tải người dùng thất bại.'}</div>;
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
      setActionError(err instanceof Error ? err.message : 'Không thể tạo người dùng');
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
      setActionError(err instanceof Error ? err.message : 'Không thể cập nhật người dùng');
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
      setActionError(err instanceof Error ? err.message : 'Không thể đổi trạng thái người dùng');
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
      setActionError(err instanceof Error ? err.message : 'Không thể xóa người dùng');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataColumn<UserRecord>[] = [
    {
      key: 'name',
      title: 'Họ tên',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
            {row.name.slice(0, 2)}
          </div>
          <div>
            <span className="font-extrabold text-slate-800 text-xs block leading-tight">{row.name}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">{row.role || 'user'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Mail size={12} className="text-slate-400 shrink-0" />
          <span className="text-xs font-semibold">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Số điện thoại',
      render: (row) => {
        const hasPhone = !!row.phone && row.phone !== 'Chưa cập nhật';
        return (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Phone size={12} className={hasPhone ? 'text-slate-400 shrink-0' : 'text-slate-350 shrink-0'} />
            <span className={hasPhone ? 'text-xs font-semibold text-slate-600' : 'text-xs italic text-slate-400 font-medium'}>
              {row.phone || 'Chưa cập nhật'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'walletBalance',
      title: 'Số dư ví',
      render: (row) => (
        <span className="font-bold text-emerald-600 text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg whitespace-nowrap">
          {row.walletBalance.toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      key: 'linkedPlates',
      title: 'Biển số liên kết',
      render: (row) => {
        const plates = row.linkedPlates || [];
        if (plates.length === 0) {
          return <span className="text-slate-400 italic text-xs font-medium">Chưa liên kết</span>;
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {plates.map((p) => (
              <span
                key={p}
                className="inline-flex items-center px-2 py-0.5 rounded border border-blue-500/25 bg-slate-50 text-slate-700 font-mono text-[10px] font-black tracking-wider shadow-sm"
              >
                {p}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (row) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-500 hover:text-white text-amber-600 hover:shadow-md transition-all duration-200"
            title="Sửa"
          >
            <Edit size={13} />
          </button>
          <button
            onClick={() => toggleStatus(row)}
            className="p-1.5 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-500 hover:text-white text-orange-600 hover:shadow-md transition-all duration-200"
            title={row.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
          >
            {row.status === 'active' ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
          <button
            onClick={() => setPendingDeleteUser(row)}
            className="p-1.5 rounded-lg bg-red-50 border border-red-100 hover:bg-red-500 hover:text-white text-red-650 hover:shadow-md transition-all duration-200"
            title="Xóa"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng khách hàng</p>
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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đang hoạt động</p>
            <p className="text-base font-black text-slate-800 mt-0.5">{stats.active}</p>
          </div>
        </div>

        {/* Blocked Users */}
        <div className="relative overflow-hidden rounded-2xl glass-premium p-4 shadow-sm border border-sky-100/60 bg-white/45 flex items-center gap-4 group hover:border-rose-500/20 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500/10 via-rose-500/30 to-red-500/10" />
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-650 flex items-center justify-center font-bold shrink-0">
            <UserX size={18} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tài khoản khóa</p>
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
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng số dư ví</p>
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
            placeholder="Tìm kiếm khách hàng theo tên, email hoặc biển số xe..."
            className="pl-9 bg-white/90 border-sky-100 focus-visible:ring-blue-500 rounded-xl text-xs font-semibold w-full h-10"
          />
        </div>

        {/* Status Filter Dropdown */}
        <CustomSelect
          className="h-10 w-full md:w-48 shrink-0"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'active', label: 'Hoạt động' },
            { value: 'blocked', label: 'Bị khóa' },
            { value: 'pending', label: 'Chờ duyệt' },
          ]}
        />

        {/* Create User Gem Button */}
        <Button 
          onClick={openCreateModal}
          className="bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-white rounded-xl font-black px-5 py-2.5 h-10 text-xs border-0 shadow-md flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-center"
        >
          <Plus size={14} /> Tạo người dùng
        </Button>
      </div>

      {/* Premium User Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl glass-premium border border-sky-100/80 p-12 text-center text-slate-500 italic">
          Không tìm thấy khách hàng nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((u) => {
            const hasPhone = !!u.phone && u.phone !== 'Chưa cập nhật';
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
                    <Mail size={13} className="text-slate-455 shrink-0" />
                    <span className="text-xs text-slate-650 truncate max-w-[200px] block">
                      {u.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <Phone size={13} className={hasPhone ? 'text-slate-455 shrink-0' : 'text-slate-350 shrink-0'} />
                    <span className={`text-xs ${hasPhone ? 'text-slate-650 font-bold' : 'italic text-slate-400 font-medium'}`}>
                      {u.phone || 'Chưa cập nhật'}
                    </span>
                  </div>
                </div>

                {/* Wallet Balance Section */}
                <div className="mt-4 pt-4 border-t border-sky-100/40 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Số dư ví</span>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg inline-block shadow-sm">
                    {u.walletBalance.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                {/* Linked Plates Container */}
                <div className="mt-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Biển số liên kết ({plates.length})</p>
                  {plates.length === 0 ? (
                    <span className="text-slate-400 italic text-xs font-medium">Chưa liên kết</span>
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
                    className="p-2 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-500 hover:text-white text-amber-600 hover:shadow-md hover:shadow-amber-500/10 transition-all duration-200"
                    title="Sửa"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => toggleStatus(u)}
                    className="p-2 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-500 hover:text-white text-orange-600 hover:shadow-md hover:shadow-orange-500/10 transition-all duration-200"
                    title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                  >
                    {u.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                  <button
                    onClick={() => setPendingDeleteUser(u)}
                    className="p-2 rounded-xl bg-red-50 border border-red-100 hover:bg-red-500 hover:text-white text-red-650 hover:shadow-md hover:shadow-red-500/10 transition-all duration-200"
                    title="Xóa"
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
        title="Cập nhật người dùng"
        onSubmit={saveUpdate}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Họ tên"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          />
          <Input placeholder="Email" value={form.email} disabled />
          <Input
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        {isSaving ? <p className="text-xs text-muted-foreground">Đang lưu...</p> : null}
      </ModalForm>

      {/* Create User Modal */}
      <ModalForm
        open={isCreating}
        onOpenChange={(open) => {
          if (!open) closeModals();
        }}
        title="Tạo người dùng"
        onSubmit={saveCreate}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Họ tên"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            placeholder="Mật khẩu"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <Input
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <div className="grid gap-1.5">
            <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vai trò</label>
            <CustomSelect
              className="h-10"
              value={form.role}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, role: val as typeof prev.role, buildingId: '' }))
              }
              options={[
                { value: 'user', label: 'Người dùng' },
                { value: 'staff', label: 'Nhân viên' },
                { value: 'manager', label: 'Quản lý' }
              ]}
            />
          </div>
          {(form.role === 'staff' || form.role === 'manager') && (
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Tòa nhà phụ trách <span className="text-red-500">*</span>
              </label>
              <CustomSelect
                className="h-10"
                value={form.buildingId}
                onChange={(val) => setForm((prev) => ({ ...prev, buildingId: val }))}
                placeholder="-- Chọn tòa nhà --"
                options={[
                  { value: '', label: '-- Chọn tòa nhà --' },
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
            {form.role === 'staff' ? 'Nhân viên' : 'Quản lý'} sẽ được gán vào tòa nhà đã chọn ngay khi tạo.
            Tài khoản loại này không hiển thị ở danh sách “Người dùng”.
          </p>
        )}
        {isSaving ? <p className="text-xs text-muted-foreground">Đang tạo...</p> : null}
      </ModalForm>

      <ConfirmModal
        open={Boolean(pendingDeleteUser)}
        title="Xác nhận xóa người dùng"
        description={`Xóa vĩnh viễn tài khoản "${pendingDeleteUser?.name || pendingDeleteUser?.email || ''}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        isConfirming={isDeleting}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteUser(null);
        }}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
}
