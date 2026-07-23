import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────────────────────── */

export type SlotDetailedStatus =
  | 'available'
  | 'selected'
  | 'reserved'
  | 'occupied'
  | 'maintenance'
  | 'unsupported';

export interface ParkingSlot {
  code: string;
  status: 'available' | 'unavailable' | 'reserved';
  vehicleType?: 'car' | 'motorcycle';
  plateNumber?: string;
  detailedStatus?: SlotDetailedStatus;
}

/* ─── SVG Icons (inline, no lock icons on occupied) ────────────────────────── */

export function CarSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M5 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM19 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor" />
      <path d="M3 13h18l-1.5-5h-2L16 5H8L6.5 8h-2L3 13Z" fill="currentColor" opacity=".7" />
      <path d="M3 13v4h3v-1h12v1h3v-4H3Z" fill="currentColor" opacity=".5" />
    </svg>
  );
}

export function MotorcycleSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="16" r="3" fill="currentColor" opacity=".7" />
      <circle cx="19" cy="16" r="3" fill="currentColor" opacity=".7" />
      <path d="M5 16h6l3-8h2l3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M11 16l1-4h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function TopDownCarSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="10" width="28" height="60" rx="6" fill="currentColor" />
      <path d="M8 28 C 8 22, 32 22, 32 28 L 30 33 L 10 33 Z" fill="#090d16" />
      <path d="M10 56 L 30 56 L 28 62 C 28 62, 12 62, 12 62 Z" fill="#090d16" />
      <rect x="9" y="32" width="22" height="25" rx="3" fill="currentColor" opacity="0.8" />
      <rect x="3" y="24" width="3" height="6" rx="1.5" fill="currentColor" />
      <rect x="34" y="24" width="3" height="6" rx="1.5" fill="currentColor" />
      <rect x="9" y="8" width="5" height="3" rx="1" fill="#fef08a" />
      <rect x="26" y="8" width="5" height="3" rx="1" fill="#fef08a" />
      <rect x="9" y="69" width="6" height="2" fill="#ef4444" />
      <rect x="25" y="69" width="6" height="2" fill="#ef4444" />
    </svg>
  );
}

function TopDownMotorcycleSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="10" width="4" height="12" rx="2" fill="#1e293b" />
      <path d="M8 25 L 32 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 26 C14 20, 26 20, 26 26 L 25 50 C25 56, 15 56, 15 50 Z" fill="currentColor" />
      <path d="M16 42 L 24 42 L 22 62 L 18 62 Z" fill="#0f172a" />
      <rect x="18" y="58" width="4" height="14" rx="2" fill="#1e293b" />
    </svg>
  );
}

/* ─── Status Helpers ───────────────────────────────────────────────────────── */

export function getDetailedStatus(
  slotCode: string,
  selectedSlot: string | null | undefined,
  maintenanceSlots: string[],
  unsupportedSlots: string[],
  activeReservations: Array<{ slotCode: string }>,
  unavailableSlots: string[],
): SlotDetailedStatus {
  if (selectedSlot === slotCode) return 'selected';
  if (maintenanceSlots.includes(slotCode)) return 'maintenance';
  if (unsupportedSlots.includes(slotCode)) return 'unsupported';
  if (activeReservations.some((r) => r.slotCode === slotCode)) return 'reserved';
  if (unavailableSlots.includes(slotCode)) return 'occupied';
  return 'available';
}

function slotBg(status: SlotDetailedStatus): string {
  switch (status) {
    case 'selected':
      return 'bg-orange-500 border-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.4)] ring-2 ring-orange-300/30';
    case 'available':
      return 'bg-emerald-500/90 border-emerald-400/40 hover:bg-emerald-400 hover:shadow-[0_0_18px_rgba(52,211,153,0.3)]';
    case 'reserved':
      return 'bg-blue-500/80 border-blue-400/40 shadow-[0_0_15px_rgba(59,130,246,0.25)]';
    case 'occupied':
    case 'maintenance':
      return 'bg-slate-800/40 border-dashed border-slate-700/50 text-slate-500 opacity-60';
    case 'unsupported':
      return 'bg-slate-950/90 border-solid border-slate-900/60 text-slate-700 cursor-not-allowed';
  }
}

function slotTextColor(status: SlotDetailedStatus): string {
  if (status === 'selected') return 'text-slate-950';
  if (status === 'available') return 'text-white';
  return 'text-slate-400';
}

const getVehicleColor = (code: string) => {
  const colors = [
    'text-slate-200',  // White/Silver
    'text-amber-500',  // Yellow/Orange
    'text-rose-500',   // Red
    'text-blue-500',   // Blue
    'text-slate-400',  // Gray
  ];
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/* ─── Slot Cell ────────────────────────────────────────────────────────────── */

export function SlotCell({
  slot,
  status,
  interactive,
  onClick,
  is3D,
}: {
  slot: ParkingSlot;
  status: SlotDetailedStatus;
  interactive: boolean;
  onClick: () => void;
  is3D: boolean;
}) {
  const isClickable = interactive && status === 'available';
  const isOccupied = status === 'occupied' || status === 'reserved' || (status === 'unsupported' && slot.status !== 'available');
  const isSelected = status === 'selected';
  const showVehicleIcon = isOccupied;
  const effectiveVehicleType = slot.vehicleType || (slot.code.toLowerCase().includes('m') ? 'motorcycle' : 'car');

  return (
    <motion.button
      type="button"
      onClick={isClickable || isSelected ? onClick : undefined}
      disabled={!isClickable && !isSelected}
      whileHover={isClickable && !is3D ? { scale: 1.08, y: -3 } : {}}
      whileTap={isClickable && !is3D ? { scale: 0.95 } : {}}
      title={`${slot.code} — ${status === 'available' ? 'Available' : status === 'selected' ? 'Selected' : status === 'occupied' ? 'Occupied' : status === 'reserved' ? 'Reserved' : status === 'maintenance' ? 'Maintenance' : 'Unsupported'}`}
      className={`
        relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 overflow-hidden
        ${is3D ? 'h-12 w-14 sm:h-14 sm:w-16' : 'h-20 w-11 sm:h-22 sm:w-13'}
        ${slotBg(status)}
        ${isClickable ? 'cursor-pointer' : isSelected ? 'cursor-pointer' : 'cursor-default'}
        ${!isClickable && !isSelected ? (status === 'unsupported' ? 'opacity-20' : 'opacity-55') : ''}
      `}
      style={is3D ? { transform: 'translateZ(10px)', transformStyle: 'preserve-3d' } : undefined}
    >
      {/* Vehicle Icon for occupied/reserved */}
      {showVehicleIcon ? (
        <div className="absolute inset-0 flex flex-col items-center justify-between p-1">
          {/* Top-down vehicle SVG */}
          <div className="w-full flex-1 flex items-center justify-center opacity-90 my-0.5">
            {effectiveVehicleType === 'car' ? (
              <TopDownCarSvg className={`h-full w-auto ${getVehicleColor(slot.code)}`} />
            ) : (
              <TopDownMotorcycleSvg className={`h-[90%] w-auto ${getVehicleColor(slot.code)}`} />
            )}
          </div>
          {/* Slot Code Badge at bottom */}
          <span className="w-full text-center bg-black/60 backdrop-blur-[1px] rounded text-[8px] sm:text-[9px] font-black tracking-wide text-white py-0.5 border border-white/5 shadow-sm">
            {slot.code}
          </span>
        </div>
      ) : (
        <span className={`text-xs sm:text-sm font-black uppercase tracking-wider ${slotTextColor(status)}`}>
          {slot.code}
        </span>
      )}

      {/* Vehicle type badge for available slots */}
      {status === 'available' && (
        <span className="absolute right-0.5 top-0.5 rounded bg-black/30 p-0.5 z-10">
          {effectiveVehicleType === 'car' ? (
            <CarSvg className="h-2 w-2 text-white/80" />
          ) : (
            <MotorcycleSvg className="h-2 w-2 text-white/80" />
          )}
        </span>
      )}

      {/* Lock overlay for unsupported slots */}
      {status === 'unsupported' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl pointer-events-none z-10">
          <Lock size={14} className="text-slate-400" />
        </div>
      )}
    </motion.button>
  );
}

/* ─── Row Component (with aisle split) ─────────────────────────────────────── */

export function ParkingRow({
  rowLabel,
  slots,
  selectedSlot,
  maintenanceSlots,
  unsupportedSlots,
  activeReservations,
  unavailableSlots,
  interactive,
  onSlotClick,
  is3D,
}: {
  rowLabel: string;
  slots: ParkingSlot[];
  selectedSlot: string | null | undefined;
  maintenanceSlots: string[];
  unsupportedSlots: string[];
  activeReservations: Array<{ slotCode: string; plateNumber: string; vehicleType: 'car' | 'motorcycle' }>;
  unavailableSlots: string[];
  interactive: boolean;
  onSlotClick?: (code: string) => void;
  is3D: boolean;
}) {
  const sorted = [...slots].sort((a, b) => {
    const numA = parseInt(a.code.replace(/[^0-9]/g, '')) || 0;
    const numB = parseInt(b.code.replace(/[^0-9]/g, '')) || 0;
    return numA - numB;
  });

  // Split into two halves for the aisle
  const mid = Math.ceil(sorted.length / 2);
  const leftSide = sorted.slice(0, mid);
  const rightSide = sorted.slice(mid);

  const renderSlot = (slot: ParkingSlot) => {
    const status = getDetailedStatus(slot.code, selectedSlot, maintenanceSlots, unsupportedSlots, activeReservations, unavailableSlots);
    return (
      <SlotCell
        key={slot.code}
        slot={slot}
        status={status}
        interactive={interactive}
        onClick={() => onSlotClick?.(slot.code)}
        is3D={is3D}
      />
    );
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Row Label */}
      <span className="w-8 shrink-0 text-right text-[10px] font-black uppercase tracking-wider text-slate-500">
        {rowLabel}
      </span>

      {/* Left slots */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {leftSide.map(renderSlot)}
      </div>

      {/* Central Aisle */}
      <div className="flex shrink-0 flex-col items-center gap-0.5 px-1 sm:px-3">
        <div className="h-8 w-0.5 rounded-full bg-amber-400/20" />
        <span className="text-[7px] font-bold uppercase tracking-widest text-amber-300/40 [writing-mode:vertical-rl]">
          Aisle
        </span>
        <div className="h-8 w-0.5 rounded-full bg-amber-400/20" />
      </div>

      {/* Right slots */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {rightSide.map(renderSlot)}
      </div>

      {/* Row Label (right) */}
      <span className="w-8 shrink-0 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">
        {rowLabel}
      </span>
    </div>
  );
}
