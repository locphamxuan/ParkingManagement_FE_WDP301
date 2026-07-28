import { motion } from 'framer-motion';
import { Building2, Edit, Eye, MapPin, Power, Trash2, Users } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Building } from '@/types';

interface BuildingCardProps {
  building: Building;
  onViewDetail: (building: Building) => void;
  onViewMembers: (building: Building) => void;
  onEdit: (building: Building) => void;
  onToggleStatus: (building: Building) => void;
  onDelete: (building: Building) => void;
}

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

export function BuildingCard({
  building: b,
  onViewDetail,
  onViewMembers,
  onEdit,
  onToggleStatus,
  onDelete,
}: BuildingCardProps) {
  const isNotUpdated = b.address.includes('not updated') || !b.address;
  return (
    <motion.div
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
          <MapPin size={13} className={isNotUpdated ? 'text-slate-400' : 'text-slate-500 shrink-0'} />
          <span className={`truncate text-xs ${isNotUpdated ? 'italic text-slate-400' : 'text-slate-600'}`}>
            {b.address}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider border border-slate-200/50">
            {b.floors} floors
          </span>
        </div>
      </div>

      {/* Occupancy Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Occupancy</span>
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
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Manager</p>
            <p className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{b.manager || 'Not assigned'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Revenue today</p>
          <p className="text-xs font-black text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg inline-block mt-0.5 shadow-sm">
            {b.revenueToday.toLocaleString('vi-VN')} ₫
          </p>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="mt-4 pt-3.5 border-t border-sky-100/40 flex items-center justify-between gap-2">
        <button
          onClick={() => onViewDetail(b)}
          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-600 transition-all duration-250 hover:bg-blue-500 hover:text-white hover:shadow-md hover:shadow-blue-500/10"
        >
          <Eye size={14} /> Details
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onViewMembers(b)}
            aria-label={`View members of ${b.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-purple-600 transition-all duration-200 hover:bg-purple-500 hover:text-white hover:shadow-md hover:shadow-purple-500/10"
            title="Members"
          >
            <Users size={14} />
          </button>
          <button
            onClick={() => onEdit(b)}
            aria-label={`Edit ${b.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600 transition-all duration-200 hover:bg-amber-500 hover:text-white hover:shadow-md hover:shadow-amber-500/10"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onToggleStatus(b)}
            aria-label={`${b.status === 'active' ? 'Deactivate' : 'Activate'} ${b.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-600 transition-all duration-200 hover:bg-orange-500 hover:text-white hover:shadow-md hover:shadow-orange-500/10"
            title={b.status === 'active' ? 'Deactivate' : 'Activate'}
          >
            <Power size={14} />
          </button>
          <button
            onClick={() => onDelete(b)}
            aria-label={`Delete ${b.name}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600 transition-all duration-200 hover:bg-red-500 hover:text-white hover:shadow-md hover:shadow-red-500/10"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
