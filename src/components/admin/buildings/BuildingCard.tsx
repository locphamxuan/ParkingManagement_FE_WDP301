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

const getOccupancyBarColor = (rate: number) => {
  if (rate >= 75) return 'linear-gradient(90deg, #10b981, #34d399)';
  if (rate >= 40) return 'linear-gradient(90deg, #0093E9, #00C6FF)';
  return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
};

const getOccupancyBadge = (rate: number) => {
  if (rate >= 75) return { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', text: '#059669' };
  if (rate >= 40) return { bg: 'rgba(0,147,233,0.12)', border: 'rgba(0,147,233,0.25)', text: '#0073b7' };
  return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', text: '#d97706' };
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
  const badge = getOccupancyBadge(b.occupancyRate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.005 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 group flex flex-col"
      style={{
        boxShadow: '0 4px 6px -2px rgba(0,0,0,0.04), 0 12px 30px -8px rgba(0,147,233,0.10)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 8px 16px -4px rgba(0,0,0,0.06), 0 20px 48px -12px rgba(0,147,233,0.22), 0 0 0 1px rgba(0,147,233,0.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          '0 4px 6px -2px rgba(0,0,0,0.04), 0 12px 30px -8px rgba(0,147,233,0.10)';
      }}
    >
      {/* Crystal Bevel Top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2.5px] rounded-t-3xl"
        style={{ background: 'linear-gradient(90deg, transparent, #0093E9, #00C6FF, transparent)' }}
      />

      {/* Inner glow on hover */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(ellipse at top center, rgba(0,147,233,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="p-6 flex flex-col flex-1">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(0,147,233,0.12), rgba(0,198,255,0.08))',
                border: '1px solid rgba(0,147,233,0.18)',
                boxShadow: '0 2px 8px rgba(0,147,233,0.15)',
              }}
            >
              <Building2 size={19} style={{ color: '#0093E9' }} />
            </div>
            <div>
              <h4 className="font-extrabold text-[0.82rem] text-slate-800 leading-tight group-hover:text-blue-600 transition-colors duration-200">
                {b.name}
              </h4>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em] mt-0.5"
                style={{ color: '#94a3b8' }}
              >
                {b.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <StatusBadge status={b.status} />
        </div>

        {/* Info Strip */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin size={12} className={isNotUpdated ? 'text-slate-300' : 'text-slate-400'} />
            <span className={`text-xs truncate ${isNotUpdated ? 'italic text-slate-300' : 'text-slate-500 font-semibold'}`}>
              {b.address}
            </span>
          </div>
          <div>
            <span
              className="inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
              style={{
                background: 'rgba(100,116,139,0.08)',
                border: '1px solid rgba(100,116,139,0.15)',
                color: '#475569',
              }}
            >
              {b.floors} {b.floors === 1 ? 'floor' : 'floors'}
            </span>
          </div>
        </div>

        {/* Occupancy Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Occupancy
            </span>
            <span
              className="px-2 py-0.5 rounded-lg text-[10px] font-black font-mono"
              style={{
                background: badge.bg,
                border: `1px solid ${badge.border}`,
                color: badge.text,
              }}
            >
              {b.occupancyRate}%
            </span>
          </div>
          <div
            className="h-2 w-full rounded-full overflow-hidden"
            style={{ background: 'rgba(226,232,240,0.8)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(b.occupancyRate, 100)}%`,
                background: getOccupancyBarColor(b.occupancyRate),
                boxShadow: b.occupancyRate > 0 ? `0 0 8px ${badge.border}` : 'none',
              }}
            />
          </div>
        </div>

        {/* Manager & Revenue */}
        <div
          className="mt-4 pt-4 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(226,232,240,0.6)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black uppercase shrink-0"
              style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#6366f1',
              }}
            >
              {b.manager ? b.manager.slice(0, 2) : 'UN'}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                Manager
              </p>
              <p className="text-xs font-bold text-slate-700 truncate max-w-[90px]">
                {b.manager || 'Unassigned'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>
              Revenue today
            </p>
            <span
              className="inline-block mt-0.5 text-xs font-black font-mono px-2 py-0.5 rounded-lg"
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.22)',
                color: '#d97706',
              }}
            >
              {b.revenueToday.toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="mt-4 pt-4 flex items-center justify-between gap-2"
          style={{ borderTop: '1px solid rgba(226,232,240,0.6)' }}
        >
          <button
            onClick={() => onViewDetail(b)}
            className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-black transition-all duration-200"
            style={{
              background: 'rgba(0,147,233,0.08)',
              border: '1px solid rgba(0,147,233,0.15)',
              color: '#0073b7',
            }}
            onMouseEnter={(e) => {
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: 'linear-gradient(135deg, #0093E9, #00C6FF)',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0,147,233,0.35)',
                border: '1px solid transparent',
              });
            }}
            onMouseLeave={(e) => {
              Object.assign((e.currentTarget as HTMLElement).style, {
                background: 'rgba(0,147,233,0.08)',
                color: '#0073b7',
                boxShadow: 'none',
                border: '1px solid rgba(0,147,233,0.15)',
              });
            }}
          >
            <Eye size={13} /> Details
          </button>

          <div className="flex items-center gap-1.5">
            {[
              {
                onClick: () => onViewMembers(b),
                label: `View members of ${b.name}`,
                title: 'Members',
                icon: <Users size={13} />,
                color: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.18)', text: '#7c3aed', hoverBg: '#8b5cf6' },
              },
              {
                onClick: () => onEdit(b),
                label: `Edit ${b.name}`,
                title: 'Edit',
                icon: <Edit size={13} />,
                color: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)', text: '#d97706', hoverBg: '#f59e0b' },
              },
              {
                onClick: () => onToggleStatus(b),
                label: `${b.status === 'active' ? 'Deactivate' : 'Activate'} ${b.name}`,
                title: b.status === 'active' ? 'Deactivate' : 'Activate',
                icon: <Power size={13} />,
                color: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.18)', text: '#ea580c', hoverBg: '#f97316' },
              },
              {
                onClick: () => onDelete(b),
                label: `Delete ${b.name}`,
                title: 'Delete',
                icon: <Trash2 size={13} />,
                color: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.18)', text: '#dc2626', hoverBg: '#ef4444' },
              },
            ].map((btn) => (
              <button
                key={btn.title}
                onClick={btn.onClick}
                aria-label={btn.label}
                title={btn.title}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200"
                style={{
                  background: btn.color.bg,
                  border: `1px solid ${btn.color.border}`,
                  color: btn.color.text,
                }}
                onMouseEnter={(e) => {
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    background: btn.color.hoverBg,
                    color: '#fff',
                    boxShadow: `0 4px 12px ${btn.color.border}`,
                    border: '1px solid transparent',
                    transform: 'scale(1.08)',
                  });
                }}
                onMouseLeave={(e) => {
                  Object.assign((e.currentTarget as HTMLElement).style, {
                    background: btn.color.bg,
                    color: btn.color.text,
                    boxShadow: 'none',
                    border: `1px solid ${btn.color.border}`,
                    transform: 'scale(1)',
                  });
                }}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
