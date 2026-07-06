import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Edit, Eye, MapPin, Plus, Power, Search, Trash2, Users } from 'lucide-react';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { CustomSelect } from '@/components/ui/select';
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
  assignManagerToBuilding,
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
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

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
    return <div className="text-sm text-muted-foreground">Đang tải danh sách tòa nhà...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Tải tòa nhà thất bại.'}</div>;
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
          console.error('Không thể tải danh sách quản lý:', err);
        } finally {
          setIsLoadingManagers(false);
        }
      }
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Không thể tải danh sách thành viên');
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleAssignManager = async (managerId: string) => {
    if (!token || !membersState) return;
    setIsMembersLoading(true);
    setMembersError(null);
    try {
      await assignManagerToBuilding(token, membersState.buildingId, managerId);
      const res = await adminApi.buildings.getMembers(membersState.buildingId);
      setMembersState({
        ...membersState,
        manager: res.data?.manager ?? null,
        staff: res.data?.staff ?? [],
      });
      await refresh();
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Không thể gán quản lý');
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
      setDetailError(err instanceof Error ? err.message : 'Không thể tải chi tiết tòa nhà');
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
      setActionError(err instanceof Error ? err.message : 'Không thể xóa thành viên');
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
      setActionError(err instanceof Error ? err.message : 'Không thể lưu tòa nhà');
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
      setActionError(err instanceof Error ? err.message : 'Không thể đổi trạng thái tòa nhà');
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
      setActionError(err instanceof Error ? err.message : 'Không thể xóa tòa nhà');
    } finally {
      setIsDeleting(false);
    }
  };

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DataColumn<Building>[] = [
    {
      key: 'name',
      title: 'Tên tòa nhà',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-blue-500 shrink-0" />
          <div className="whitespace-nowrap">
            <span className="font-black text-sm text-slate-800 block leading-tight whitespace-nowrap">{row.name}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{row.id.slice(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      title: 'Địa chỉ',
      render: (row) => {
        const isNotUpdated = row.address.includes('not updated') || !row.address;
        return (
          <div className="flex items-center gap-1 text-slate-500 max-w-[130px]">
            <MapPin size={12} className={isNotUpdated ? 'text-slate-300' : 'text-slate-400 shrink-0'} />
            <span className={`truncate text-xs ${isNotUpdated ? 'italic text-slate-400 font-medium' : 'font-bold text-slate-650'}`}>
              {row.address}
            </span>
          </div>
        );
      },
    },
    {
      key: 'floors',
      title: 'Số tầng',
      render: (row) => (
        <span className="inline-flex items-center rounded-lg bg-slate-55 px-2 py-0.5 text-xs font-bold text-slate-600 uppercase tracking-wider border border-slate-200/40">
          {row.floors} tầng
        </span>
      ),
    },
    {
      key: 'occupancyRate',
      title: 'Mức độ đông đúc',
      render: (row) => {
        const getRateBg = (rate: number) => {
          if (rate >= 75) return 'bg-emerald-55 border-emerald-500/20 text-emerald-600';
          if (rate >= 40) return 'bg-blue-55 border-blue-500/20 text-blue-650';
          return 'bg-amber-55 border-amber-500/20 text-amber-605';
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black font-mono border ${getRateBg(row.occupancyRate)}`}>
            {row.occupancyRate}%
          </span>
        );
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'manager',
      title: 'Người quản lý',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <div className="w-5.5 h-5.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-[9px] font-black text-indigo-650 uppercase shrink-0">
            {row.manager ? row.manager.slice(0, 2) : 'Un'}
          </div>
          <span className="font-bold text-slate-700 truncate max-w-[100px] text-xs">{row.manager || 'Chưa phân công'}</span>
        </div>
      ),
    },
    {
      key: 'revenueToday',
      title: 'Doanh thu hôm nay',
      render: (row) => (
        <span className="font-black text-slate-800 text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg whitespace-nowrap">
          {row.revenueToday.toLocaleString('vi-VN')} ₫
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (row) => (
        <div className="flex items-center gap-1 whitespace-nowrap">
          <button
            onClick={() => openViewDetail(row)}
            className="p-1.5 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-500 hover:text-white text-blue-600 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-200"
            title="Chi tiết"
          >
            <Eye size={13} />
          </button>
          <button
            onClick={() => openViewMembers(row)}
            className="p-1.5 rounded-lg bg-purple-50 border border-purple-100 hover:bg-purple-500 hover:text-white text-purple-600 hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200"
            title="Thành viên"
          >
            <Users size={13} />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-500 hover:text-white text-amber-600 hover:shadow-md hover:shadow-amber-500/10 transition-all duration-200"
            title="Sửa"
          >
            <Edit size={13} />
          </button>
          <button
            onClick={() => toggleBuildingStatus(row)}
            className="p-1.5 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-500 hover:text-white text-orange-600 hover:shadow-md hover:shadow-orange-500/10 transition-all duration-200"
            title={row.status === 'active' ? 'Ngưng hoạt động' : 'Kích hoạt'}
          >
            <Power size={13} />
          </button>
          <button
            onClick={() => removeBuildingById(row)}
            className="p-1.5 rounded-lg bg-red-50 border border-red-100 hover:bg-red-500 hover:text-white text-red-600 hover:shadow-md hover:shadow-red-500/10 transition-all duration-200"
            title="Xóa"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  const filterOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Ngưng hoạt động' },
    { value: 'maintenance', label: 'Bảo trì' },
    { value: 'warning', label: 'Cảnh báo' },
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
            placeholder="Tìm kiếm tòa nhà theo tên hoặc địa chỉ..."
            className="pl-9 bg-white/90 border-sky-100 focus-visible:ring-blue-500 rounded-xl text-xs font-semibold w-full h-10"
          />
        </div>

        {/* Status Filter Dropdown */}
        <CustomSelect
          className="h-10 w-full md:w-48 shrink-0"
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
          className="bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-600 hover:shadow-lg hover:shadow-blue-500/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-white rounded-xl font-black px-5 py-2.5 h-10 text-xs border-0 shadow-md flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-center"
        >
          <Plus size={14} /> Tạo tòa nhà
        </Button>
      </div>

      {/* Premium Building Cards Grid */}
      {pageRows.length === 0 ? (
        <div className="rounded-3xl glass-premium border border-sky-100/80 p-12 text-center text-slate-500 italic">
          Không tìm thấy tòa nhà nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pageRows.map((b) => {
            const isNotUpdated = b.address.includes('not updated') || !b.address;
            const getRateBg = (rate: number) => {
              if (rate >= 75) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600';
              if (rate >= 40) return 'bg-blue-500/10 border-blue-500/20 text-blue-600';
              return 'bg-amber-500/10 border-amber-500/20 text-amber-600';
            };
            const getRateColor = (rate: number) => {
              if (rate >= 75) return 'from-emerald-500 to-teal-400 bg-emerald-500';
              if (rate >= 40) return 'from-blue-500 to-sky-400 bg-blue-500';
              return 'from-amber-500 to-orange-400 bg-amber-500';
            };
            return (
              <motion.div
                key={b.id}
                whileHover={{ scale: 1.01, y: -4 }}
                className="relative overflow-hidden rounded-3xl glass-premium p-6 shadow-md border border-sky-100/85 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(37,99,235,0.06)] hover:border-blue-500/25 group bg-white/40"
              >
                {/* Crystal Bevel Border */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />

                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-500/10 shadow-sm">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{b.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{b.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                {/* Card Info Details */}
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <MapPin size={13} className={isNotUpdated ? 'text-slate-350' : 'text-slate-455 shrink-0'} />
                    <span className={`truncate text-xs ${isNotUpdated ? 'italic text-slate-400' : 'text-slate-650'}`}>
                      {b.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border border-slate-200/50">
                      {b.floors} tầng
                    </span>
                  </div>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mức độ đông đúc</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black font-mono border ${getRateBg(b.occupancyRate)}`}>
                      {b.occupancyRate}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/20">
                    <div
                      className={`h-full bg-gradient-to-r ${getRateColor(b.occupancyRate)} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.min(b.occupancyRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Manager & Revenue Section */}
                <div className="mt-4 pt-4 border-t border-sky-100/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase shrink-0">
                      {b.manager ? b.manager.slice(0, 2) : 'Un'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Quản lý</p>
                      <p className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{b.manager || 'Chưa gán'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Doanh thu hôm nay</p>
                    <p className="text-xs font-black text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg inline-block mt-0.5 shadow-sm">
                      {b.revenueToday.toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3.5 border-t border-sky-100/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openViewDetail(b)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-500 hover:text-white text-blue-600 hover:shadow-md hover:shadow-blue-500/10 text-xs font-black transition-all duration-250"
                  >
                    <Eye size={14} /> Chi tiết
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openViewMembers(b)}
                      className="p-2 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-500 hover:text-white text-purple-600 hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200"
                      title="Thành viên"
                    >
                      <Users size={14} />
                    </button>
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-2 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-500 hover:text-white text-amber-600 hover:shadow-md hover:shadow-amber-500/10 transition-all duration-200"
                      title="Sửa"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => toggleBuildingStatus(b)}
                      className="p-2 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-500 hover:text-white text-orange-600 hover:shadow-md hover:shadow-orange-500/10 transition-all duration-200"
                      title={b.status === 'active' ? 'Ngưng hoạt động' : 'Kích hoạt'}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => removeBuildingById(b)}
                      className="p-2 rounded-xl bg-red-50 border border-red-100 hover:bg-red-500 hover:text-white text-red-650 hover:shadow-md hover:shadow-red-500/10 transition-all duration-200"
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5">
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="bg-white/80 hover:bg-slate-100 text-slate-700 font-bold border border-sky-100 rounded-xl px-4 py-2 text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all h-auto"
        >
          Trước
        </Button>
        <span className="text-xs font-mono font-bold text-slate-500 px-3 py-1.5 rounded-lg bg-slate-50 border border-sky-100/50">
          Trang {page} / {maxPage}
        </span>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          className="bg-white/80 hover:bg-slate-100 text-slate-700 font-bold border border-sky-100 rounded-xl px-4 py-2 text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all h-auto"
        >
          Tiếp
        </Button>
      </div>

      {/* Members Modal */}
      {membersState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Thành viên — {membersState.buildingName}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setMembersState(null)}>
                ✕
              </Button>
            </div>

            {isMembersLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải danh sách thành viên...</p>
            ) : membersError ? (
              <p className="text-sm text-red-600">{membersError}</p>
            ) : (
              <div className="grid gap-4">
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Quản lý
                  </h3>
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
                      >
                        Xóa
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-dashed border-border p-4 bg-muted/20">
                      <p className="text-sm text-muted-foreground italic">Chưa có quản lý cho tòa nhà này</p>
                      {isLoadingManagers ? (
                        <p className="text-xs text-muted-foreground font-mono animate-pulse">Đang tải danh sách quản lý chưa được gán...</p>
                      ) : unassignedManagers.length === 0 ? (
                        <p className="text-xs text-amber-500 font-medium">Không có quản lý nào chưa được gán tòa nhà.</p>
                      ) : (
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Gán quản lý:</label>
                          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                            {unassignedManagers.map((mgr) => (
                              <div key={mgr._id} className="flex items-center justify-between rounded-lg border border-border bg-background p-2.5 text-xs">
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className="font-semibold text-foreground truncate">{mgr.fullName}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{mgr.email}</p>
                                </div>
                                <Button
                                  size="sm"
                                  className="h-7 text-[11px] px-3 font-semibold"
                                  onClick={() => handleAssignManager(mgr._id)}
                                >
                                  Gán
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nhân viên ({membersState.staff.length})
                  </h3>
                  {membersState.staff.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Chưa có nhân viên</p>
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
                            >
                              Xóa
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

      {/* Building Detail Modal (read-only operator view) */}
      {detailState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Chi tiết tòa nhà — {detailState.buildingName}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setDetailState(null)}>
                ✕
              </Button>
            </div>

            {isDetailLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải chi tiết tòa nhà...</p>
            ) : detailError ? (
              <p className="text-sm text-red-600">{detailError}</p>
            ) : (
              <div className="grid max-h-[70vh] gap-5 overflow-y-auto">
                {/* Chính sách giá */}
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Chính sách giá ({detailState.pricePolicies.length})
                  </h3>
                  {detailState.pricePolicies.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">Tòa nhà chưa cấu hình chính sách giá.</p>
                  ) : (
                    <div className="grid gap-2">
                      {detailState.pricePolicies.map((p) => (
                        <div key={p._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {vehicleTypeLabel(p.vehicleType)} · {fmtVnd(p.hourlyRate)}/giờ
                              {p.dailyCap ? ` · trần ngày ${fmtVnd(p.dailyCap)}` : ''}
                            </p>
                          </div>
                          <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Gói dài hạn của tòa nhà */}
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Gói dài hạn ({detailState.packages.length})
                  </h3>
                  {detailState.packages.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">Tòa nhà chưa phát hành gói dài hạn nào.</p>
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
                              {vehicleTypeLabel(pkg.vehicleType)} · {fmtVnd(pkg.price)} · {pkg.durationDays} ngày
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
        title={selectedBuilding ? 'Sửa tòa nhà' : 'Tạo tòa nhà'}
        onSubmit={saveBuilding}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tên tòa nhà</label>
            <Input
              placeholder="Nhập tên tòa nhà"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mã tòa nhà</label>
            <Input
              placeholder="Nhập mã tòa nhà"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Địa chỉ</label>
            <Input
              placeholder="Nhập địa chỉ"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Số tầng</label>
            <Input
              placeholder="Nhập số tầng"
              value={form.floors}
              onChange={(e) => setForm((prev) => ({ ...prev, floors: e.target.value }))}
            />
          </div>
          {!selectedBuilding ? (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Giá theo giờ (VND)</label>
              <Input
                placeholder="Nhập giá theo giờ"
                value={form.hourlyRate}
                onChange={(e) => setForm((prev) => ({ ...prev, hourlyRate: e.target.value }))}
              />
            </div>
          ) : null}
        </div>
        {isSaving ? <p className="text-xs text-muted-foreground">Đang lưu...</p> : null}
      </ModalForm>

      <ConfirmModal
        open={Boolean(pendingDeleteBuilding)}
        title="Xác nhận xóa tòa nhà"
        description={`Bạn có chắc chắn muốn xóa tòa nhà ${pendingDeleteBuilding?.name || ''}? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        isConfirming={isDeleting}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteBuilding(null);
        }}
        onConfirm={confirmRemoveBuilding}
      />

      <ConfirmModal
        open={Boolean(pendingDeleteMember)}
        title={`Xóa tài khoản ${pendingDeleteMember?.role === 'manager' ? 'quản lý' : 'nhân viên'}`}
        description={`Xóa vĩnh viễn tài khoản "${pendingDeleteMember?.fullName || pendingDeleteMember?.email || ''}" (${pendingDeleteMember?.email || ''})? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        isConfirming={isDeletingMember}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteMember(null);
        }}
        onConfirm={confirmDeleteMember}
      />
    </div>
  );
}
