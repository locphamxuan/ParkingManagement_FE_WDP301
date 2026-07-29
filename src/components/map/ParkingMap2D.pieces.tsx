import { motion } from 'framer-motion';

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

/* ─── Status Helpers ───────────────────────────────────────────────────────── */

export function getDetailedStatus(
  slotCode: string,
  selectedSlot: string | null | undefined,
  maintenanceSlots: string[],
  unsupportedSlots: string[],
  unavailableSlots: string[],
): SlotDetailedStatus {
  if (selectedSlot === slotCode) return 'selected';
  if (maintenanceSlots.includes(slotCode)) return 'maintenance';
  if (unsupportedSlots.includes(slotCode)) return 'unsupported';
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
  const isSelected = status === 'selected';
  const isCar = !slot.vehicleType || slot.vehicleType === 'car';

  return (
    <motion.button
      type="button"
      onClick={isClickable || isSelected ? onClick : undefined}
      disabled={!isClickable && !isSelected}
      whileHover={isClickable && !is3D ? { scale: 1.08, y: -3 } : {}}
      whileTap={isClickable && !is3D ? { scale: 0.95 } : {}}
      title={`${slot.code} — ${status === 'available' ? 'Available' : 'Selected'}`}
      className={`
        relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 overflow-hidden px-2 py-1.5
        ${is3D ? 'h-12 w-16 sm:h-14 sm:w-20' : 'h-16 w-24 sm:h-20 sm:w-28'}
        ${slotBg(status)}
        ${isClickable || isSelected ? 'cursor-pointer' : 'cursor-default'}
      `}
      style={is3D ? { transform: 'translateZ(10px)', transformStyle: 'preserve-3d' } : undefined}
    >
      <span className={`text-xs sm:text-sm font-black uppercase tracking-wider ${slotTextColor(status)}`}>
        {slot.code}
      </span>
      <span className="text-sm sm:text-base mt-0.5">
        {isCar ? '🏎️' : '🏍️'}
      </span>
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
    const status = getDetailedStatus(slot.code, selectedSlot, maintenanceSlots, unsupportedSlots, unavailableSlots);
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

  const rowTitle = `ROW ${rowLabel}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <span className="text-orange-400 font-mono">{rowTitle}</span>
      </div>
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
    </div>
  );
}
