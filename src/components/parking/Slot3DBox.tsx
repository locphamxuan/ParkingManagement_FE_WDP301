import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartoonCar3D, type CartoonCar3DProps } from '@/components/map/CartoonCar3D';
import type { ParkingSlot, VehicleType } from '@/services/manager/managerApi';

// Suy ra mẫu xe 3D từ tên/mã loại xe của ô đỗ (để minh hoạ xe đang đỗ cho trực quan).
export const carModelFromVehicleType = (name: string): CartoonCar3DProps['type'] => {
  const s = (name || '').toLowerCase();
  if (/suv|gầm cao|crossover/.test(s)) return 'suv';
  if (/truck|tải|pickup|bán tải/.test(s)) return 'pickup';
  if (/van|khách|limousine/.test(s)) return 'minivan';
  if (/motor|xe m|máy|bike|ebike|scooter/.test(s)) return 'hatchback';
  if (/lux|sang|vip/.test(s)) return 'luxury';
  return 'sedan';
};

const STATUS_CONFIG = {
  available: {
    faceColor: 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300',
    label: 'Available',
    glow: 'shadow-[0_0_14px_rgba(16,185,129,0.25),0_0_4px_rgba(16,185,129,0.1)] hover:shadow-[0_0_28px_rgba(16,185,129,0.6),0_0_8px_rgba(16,185,129,0.3)]',
  },
  occupied: {
    faceColor: 'bg-red-500/25 border-red-500/45 text-red-300',
    label: 'Occupied',
    glow: 'shadow-[0_0_14px_rgba(239,68,68,0.35),0_0_4px_rgba(239,68,68,0.15)] hover:shadow-[0_0_28px_rgba(239,68,68,0.65),0_0_8px_rgba(239,68,68,0.3)]',
  },
  reserved: {
    faceColor: 'bg-purple-500/25 border-purple-500/45 text-purple-300',
    label: 'Reserved',
    glow: 'shadow-[0_0_14px_rgba(168,85,247,0.35),0_0_4px_rgba(168,85,247,0.15)] hover:shadow-[0_0_28px_rgba(168,85,247,0.65),0_0_8px_rgba(168,85,247,0.3)]',
  },
  maintenance: {
    faceColor: 'bg-amber-500/20 border-amber-500/35 text-amber-300 bg-[repeating-linear-gradient(45deg,rgba(245,158,11,0.12),rgba(245,158,11,0.12)_6px,rgba(0,0,0,0.4)_6px,rgba(0,0,0,0.4)_12px)]',
    label: 'Maintenance',
    glow: 'shadow-[0_0_14px_rgba(245,158,11,0.2),0_0_4px_rgba(245,158,11,0.1)] hover:shadow-[0_0_28px_rgba(245,158,11,0.55),0_0_8px_rgba(245,158,11,0.25)]',
  },
} as const;

export interface Slot3DBoxProps {
  slot: ParkingSlot;
  onClick?: () => void;
  /** Khi có, các ô không khớp trạng thái sẽ bị làm mờ. */
  statusFilter?: string;
  vehicleTypes?: VehicleType[];
}

/**
 * Ô đỗ 3D (CSS extrude) — hiển thị trạng thái theo màu, xe hoạt hình cho ô có xe /
 * đã đặt, và tooltip chi tiết khi hover. Dùng chung cho trang Manager (sơ đồ 3D)
 * lẫn preview khi Staff check-in.
 */
export function Slot3DBox({ slot, onClick, statusFilter = '', vehicleTypes = [] }: Slot3DBoxProps) {
  const [hovered, setHovered] = useState(false);
  const config = STATUS_CONFIG[slot.status];
  const isFilteredOut = statusFilter && slot.status !== statusFilter;

  const vtName = useMemo(() => {
    if (!slot.vehicleType) return '— Any type —';
    if (typeof slot.vehicleType === 'object') return slot.vehicleType.name;
    const found = vehicleTypes.find((v) => v._id === slot.vehicleType);
    return found ? found.name : 'Vehicle type';
  }, [slot.vehicleType, vehicleTypes]);

  return (
    <div
      className={`relative transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${isFilteredOut ? 'opacity-25 scale-95 blur-[0.5px]' : 'opacity-100'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{ width: '60px', height: '40px', transformStyle: 'preserve-3d' }}
    >
      {/* Extruded CSS 3D Box Container */}
      <div
        className={`box-3d w-full h-full rounded transition-all duration-300 ${config.glow}`}
        style={{
          '--box-w': '60px',
          '--box-d': '40px',
          '--box-h': hovered ? '20px' : '10px',
          transform: hovered ? 'translateZ(10px)' : 'translateZ(0px)',
          transformStyle: 'preserve-3d',
        } as React.CSSProperties}
      >
        {/* Top Face — kẻ ô + mã ô ở góc để không che xe */}
        <div className={`box-3d-face box-3d-top rounded border-t border-x ${config.faceColor}`}>
          <span className="absolute top-0.5 left-1 font-mono text-[8px] font-black uppercase tracking-wider leading-none">
            {slot.code}
          </span>
          <span className="absolute top-1 bottom-1 left-1.5 w-[1.5px] rounded bg-white/25" />
          <span className="absolute top-1 bottom-1 right-1.5 w-[1.5px] rounded bg-white/25" />
        </div>
        <div className={`box-3d-face box-3d-front border-b border-x ${config.faceColor}`} />
        <div className={`box-3d-face box-3d-right border-y border-r ${config.faceColor}`} />
        <div className={`box-3d-face box-3d-back ${config.faceColor}`} />
        <div className={`box-3d-face box-3d-left ${config.faceColor}`} />
      </div>

      {/* Xe 3D minh hoạ — ô có xe: xe đặc; ô đã đặt: xe mờ (ghost). */}
      {(slot.status === 'occupied' || slot.status === 'reserved') && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none preserve-3d"
          style={{
            transform: `translateZ(${hovered ? 26 : 15}px) scale(0.6)`,
            opacity: slot.status === 'reserved' ? 0.5 : 1,
            transition: 'transform 0.3s ease',
          }}
        >
          <CartoonCar3D
            type={carModelFromVehicleType(vtName)}
            color={slot.status === 'reserved' ? '#a855f7' : '#0e7490'}
            state="parked"
          />
        </div>
      )}

      {/* Tooltip chi tiết (đối xoay để hướng về người xem) */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, z: 20 }}
            animate={{ opacity: 1, scale: 1, z: 35 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-50 pointer-events-none w-44 glass-panel-dark border border-white/10 rounded-2xl p-3 shadow-2xl"
            style={{
              bottom: '120%',
              left: '50%',
              transform: 'translateX(-50%) translateZ(35px) rotateZ(45deg) rotateX(-60deg)',
              transformOrigin: 'bottom center',
            }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-black text-white font-mono">{slot.code}</span>
              <span
                className={`text-[8px] font-black uppercase font-mono px-1.5 py-0.5 rounded ${
                  slot.status === 'available'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : slot.status === 'occupied'
                      ? 'bg-orange-500/10 text-orange-400'
                      : slot.status === 'reserved'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                {config.label}
              </span>
            </div>
            <div className="space-y-1 text-[9px] text-slate-400 font-semibold leading-relaxed">
              <p>Type: <span className="text-white font-black">{vtName}</span></p>
              <p>Reservable: <span className="text-white font-black">{slot.reservable ? 'Yes' : 'Locked'}</span></p>
              {slot.note && <p className="border-t border-white/5 pt-1 mt-1 text-slate-500 italic">Note: {slot.note}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
