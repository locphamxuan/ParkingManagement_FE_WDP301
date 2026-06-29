import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { ParkingSlot, VehicleType } from '@/services/manager/managerApi';

export function Slot3DBox({
  slot,
  onClick,
  statusFilter,
  vehicleTypes,
  isSelected
}: {
  slot: ParkingSlot;
  onClick: () => void;
  statusFilter: string;
  vehicleTypes: VehicleType[];
  isSelected: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  // Status-based coloring and lighting profiles — enhanced neon glow
  const config = {
    available: {
      faceColor: 'bg-emerald-50 border-emerald-300 text-emerald-700',
      label: 'Available',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.12)] hover:shadow-[0_0_16px_rgba(16,185,129,0.3)]'
    },
    occupied: {
      faceColor: 'bg-rose-50 border-rose-300 text-rose-700',
      label: 'Occupied',
      glow: 'shadow-[0_0_8px_rgba(244,63,94,0.12)] hover:shadow-[0_0_16px_rgba(244,63,94,0.3)]'
    },
    reserved: {
      faceColor: 'bg-sky-50 border-sky-300 text-sky-700',
      label: 'Reserved',
      glow: 'shadow-[0_0_8px_rgba(14,165,233,0.12)] hover:shadow-[0_0_16px_rgba(14,165,233,0.3)]'
    },
    maintenance: {
      faceColor: 'bg-amber-50 border-amber-300 text-amber-700 bg-[repeating-linear-gradient(45deg,rgba(245,158,11,0.06),rgba(245,158,11,0.06)_6px,rgba(255,255,255,0.7)_6px,rgba(255,255,255,0.7)_12px)]',
      label: 'Maintenance',
      glow: 'shadow-[0_0_8px_rgba(245,158,11,0.12)] hover:shadow-[0_0_16px_rgba(245,158,11,0.3)]'
    }
  }[slot.status];

  // Respect status filters by dimming slots that do not match the filter
  const isFilteredOut = statusFilter && slot.status !== statusFilter;

  // Resolve vehicle type name
  const vtName = useMemo(() => {
    if (!slot.vehicleType) return '— Not fixed —';
    if (typeof slot.vehicleType === 'object') return slot.vehicleType.name;
    const found = vehicleTypes.find(v => v._id === slot.vehicleType);
    return found ? found.name : 'Vehicle type';
  }, [slot.vehicleType, vehicleTypes]);

  return (
    <div
      className={`relative cursor-pointer transition-all duration-300 ${isFilteredOut ? 'opacity-25 scale-95 blur-[0.5px]' : 'opacity-100'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        width: '60px',
        height: '40px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Extruded CSS 3D Box Container */}
      <div
        className={cn(
          "box-3d w-full h-full rounded transition-all duration-300",
          config.glow,
          isSelected && "ring-2 ring-sky-400 ring-offset-1 shadow-[0_0_15px_rgba(56,189,248,0.7)]"
        )}
        style={{
          '--box-w': '60px',
          '--box-d': '40px',
          '--box-h': isSelected ? '24px' : hovered ? '20px' : '10px',
          transform: isSelected ? 'translateZ(14px)' : hovered ? 'translateZ(10px)' : 'translateZ(0px)',
          transformStyle: 'preserve-3d'
        } as React.CSSProperties}
      >
        {/* Top Face */}
        <div className={`box-3d-face box-3d-top rounded border-t border-x ${config.faceColor} flex items-center justify-center font-mono text-[9px] font-black uppercase tracking-wider`}>
          {slot.code}
        </div>

        {/* Front Face */}
        <div className={`box-3d-face box-3d-front border-b border-x ${config.faceColor}`} />

        {/* Right Face */}
        <div className={`box-3d-face box-3d-right border-y border-r ${config.faceColor}`} />

        {/* Back Face */}
        <div className={`box-3d-face box-3d-back ${config.faceColor}`} />

        {/* Left Face */}
        <div className={`box-3d-face box-3d-left ${config.faceColor}`} />
      </div>

      {/* Floating Glassmorphic Tooltip (Counter-Rotated dynamically) */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, z: 20 }}
            animate={{ opacity: 1, scale: 1, z: 35 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-50 pointer-events-none w-44 bg-white border border-sky-100 rounded-2xl p-3 shadow-lg text-slate-800"
            style={{
              bottom: '120%',
              left: '50%',
              transform: 'translateX(-50%) translateZ(35px) rotateZ(45deg) rotateX(-60deg)',
              transformOrigin: 'bottom center'
            }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-black text-slate-800 font-mono">{slot.code}</span>
              <span className={`text-[8px] font-black uppercase font-mono px-1.5 py-0.5 rounded ${
                slot.status === 'available' ? 'bg-emerald-50 text-emerald-700' :
                slot.status === 'occupied' ? 'bg-red-50 text-red-750' :
                slot.status === 'reserved' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {config.label}
              </span>
            </div>
            <div className="space-y-1 text-[9px] text-slate-500 font-semibold leading-relaxed">
              <p>Type: <span className="text-slate-800 font-black">{vtName}</span></p>
              <p>Reservation: <span className="text-slate-800 font-black">{slot.reservable ? 'Yes' : 'Lock'}</span></p>
              {slot.note && <p className="border-t border-sky-100 pt-1 mt-1 text-slate-400 italic">Note: {slot.note}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
