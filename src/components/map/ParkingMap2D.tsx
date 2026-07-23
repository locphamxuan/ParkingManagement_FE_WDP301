import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ParkingRow, type ParkingSlot, type SlotDetailedStatus } from './ParkingMap2D.pieces';

export type { ParkingSlot, SlotDetailedStatus };

export interface ParkingMap2DProps {
  slots: ParkingSlot[];
  selectedSlot?: string | null;
  activeReservations?: Array<{ slotCode: string; plateNumber: string; vehicleType: 'car' | 'motorcycle' }>;
  unavailableSlots?: string[];
  maintenanceSlots?: string[];
  unsupportedSlots?: string[];
  onSlotClick?: (slotCode: string) => void;
  interactive?: boolean;
  onConfirm?: () => void;
  onClose?: () => void;
  children?: React.ReactNode;
  placeholder?: React.ReactNode;
  className?: string;
  floorName?: string;
  filterVehicleType?: 'car' | 'motorcycle';
}

/* ─── Legend ────────────────────────────────────────────────────────────────── */

function Legend() {
  return (
    <div className="flex flex-wrap justify-center gap-6 py-2 border-b border-white/5 mb-5">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
        <span className="text-xs font-bold text-slate-400">Available</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
        <span className="text-xs font-bold text-slate-400">Selected</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
        <span className="text-xs font-bold text-slate-400">Reserved</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full border border-dashed border-slate-500/80 bg-transparent opacity-60" />
        <span className="text-xs font-bold text-slate-400">Unavailable</span>
      </div>
    </div>
  );
}

/* ─── Entry / Exit Markers ─────────────────────────────────────────────────── */

function EntryExitMarkers() {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M1 8h12M9 4l4 4-4 4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400/70">Entrance</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400/70">Exit</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M1 8h12M9 4l4 4-4 4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ─── View Toggle ──────────────────────────────────────────────────────────── */

function ViewToggle({ view, onChange }: { view: '2D' | '3D'; onChange: (v: '2D' | '3D') => void }) {
  return (
    <div className="inline-flex rounded-full bg-slate-950 p-1 border border-white/5 shadow-inner">
      {(['2D', '3D'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`relative rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
            view === v
              ? 'bg-orange-500 text-slate-950 font-black shadow-[0_0_12px_rgba(249,115,22,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {v === '2D' ? '2D Grid' : '3D View'}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export function ParkingMap2D({
  slots,
  selectedSlot = null,
  activeReservations = [],
  unavailableSlots = [],
  maintenanceSlots = [],
  unsupportedSlots = [],
  onSlotClick,
  interactive = false,
  onConfirm,
  onClose,
  children,
  placeholder,
  className = "w-full rounded-3xl border border-slate-800/80 bg-[#080d17] p-4 sm:p-5",
  floorName,
  filterVehicleType,
}: ParkingMap2DProps) {
  const [view, setView] = useState<'2D' | '3D'>('2D');
  const [rotateX, setRotateX] = useState(45);
  const [rotateZ, setRotateZ] = useState(-10);
  const [zoom, setZoom] = useState(0.85);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const startRotateXRef = useRef(45);
  const startRotateZRef = useRef(-10);

  const reset3D = () => {
    setRotateX(45);
    setRotateZ(-10);
    setZoom(0.85);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (view !== '3D' || e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startRotateXRef.current = rotateX;
    startRotateZRef.current = rotateZ;
    hasMovedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || view !== '3D') return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMovedRef.current = true;
      setRotateZ(startRotateZRef.current + dx * 0.5);
      setRotateX(Math.max(25, Math.min(75, startRotateXRef.current - dy * 0.5)));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleSlotClick = (code: string) => {
    if (hasMovedRef.current) return;
    onSlotClick?.(code);
  };

  // Filter slots strictly by available status (when interactive) & vehicleType if provided
  const displaySlots = useMemo(() => {
    return slots.filter((slot) => {
      // In interactive slot picker mode, ONLY display available slots that can be parked in!
      if (interactive && slot.status !== 'available') return false;

      if (filterVehicleType) {
        if (slot.vehicleType) {
          return slot.vehicleType === filterVehicleType;
        }
        const codeLower = slot.code.toLowerCase();
        const derivedVt = (codeLower.includes('m') || codeLower.includes('xe') || codeLower.includes('moto')) && !codeLower.startsWith('ddkp') ? 'motorcycle' : 'car';
        return derivedVt === filterVehicleType;
      }

      return true;
    });
  }, [slots, filterVehicleType, interactive]);

  // Group slots by row / zone code prefix (e.g. 'DDKP-01' -> 'DDKP', 'AC-04' -> 'AC')
  const slotsByRow = useMemo(() => {
    const grouped: Record<string, ParkingSlot[]> = {};
    displaySlots.forEach((slot) => {
      const row = slot.code.includes('-') ? slot.code.split('-')[0] : slot.code.charAt(0);
      if (!grouped[row]) grouped[row] = [];
      grouped[row].push(slot);
    });
    return grouped;
  }, [displaySlots]);

  const rows = useMemo(() => Object.keys(slotsByRow).sort(), [slotsByRow]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
            <span>AVAILABLE PARKING SLOTS</span>
            {floorName && (
              <span className="text-orange-400 font-mono text-base font-black">
                — {floorName}
              </span>
            )}
          </h2>
          <p className="mt-1 text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <span>Select an available slot to reserve</span>
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-slate-400 hover:text-white transition duration-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nút Chuyển Đổi Chế Độ (Centered Pill Tab) */}
      <div className="flex justify-center mb-6">
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Children elements (like floor selection drop downs) */}
      {children}

      {placeholder ? (
        placeholder
      ) : (
        <>
          {/* Legend */}
          <div className="mb-5">
            <Legend />
          </div>

          {/* 3D Interactive Controls */}
          {view === '3D' && (
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-3.5 text-xs mb-5 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Tilt:</span>
                <input
                  type="range"
                  min="25"
                  max="75"
                  value={rotateX}
                  onChange={(e) => setRotateX(Number(e.target.value))}
                  className="w-20 accent-orange-500 bg-slate-800 rounded-lg h-1 appearance-none cursor-pointer"
                />
                <span className="font-mono text-slate-300 w-8 text-right">{rotateX}°</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Rotate:</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotateZ}
                  onChange={(e) => setRotateZ(Number(e.target.value))}
                  className="w-24 accent-orange-500 bg-slate-800 rounded-lg h-1 appearance-none cursor-pointer"
                />
                <span className="font-mono text-slate-300 w-10 text-right">{rotateZ}°</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Zoom:</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.05).toFixed(2))))}
                  className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-black flex items-center justify-center"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.4"
                  max="1.6"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-20 accent-orange-500 bg-slate-800 rounded-lg h-1 appearance-none cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.05).toFixed(2))))}
                  className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-black flex items-center justify-center"
                >
                  +
                </button>
                <span className="font-mono text-slate-300 w-12 text-right">{Math.round(zoom * 100)}%</span>
              </div>
              <button
                type="button"
                onClick={reset3D}
                className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-orange-500/30 text-[9px] font-black uppercase tracking-wider text-slate-300 hover:text-orange-200 transition duration-200"
              >
                Reset
              </button>
            </div>
          )}

          {/* Entry marker */}
          <EntryExitMarkers />

          {/* Parking Grid */}
          <AnimatePresence mode="wait">
            {view === '2D' ? (
              <motion.div
                key="view-2d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 py-4"
              >
                {rows.map((row) => (
                  <ParkingRow
                    key={row}
                    rowLabel={row}
                    slots={slotsByRow[row]}
                    selectedSlot={selectedSlot}
                    maintenanceSlots={maintenanceSlots}
                    unsupportedSlots={unsupportedSlots}
                    activeReservations={activeReservations}
                    unavailableSlots={unavailableSlots}
                    interactive={interactive}
                    onSlotClick={handleSlotClick}
                    is3D={false}
                  />
                ))}
              </motion.div>
            ) : (
              <div
                role="presentation"
                className="relative w-full h-[450px] overflow-hidden rounded-2xl bg-[#040810]/90 border border-white/5 cursor-grab active:cursor-grabbing flex items-center justify-center select-none"
                style={{ perspective: '1200px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div
                  className="origin-center transition-transform duration-75 ease-out"
                  style={{
                    transform: `rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${zoom})`,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {rows.map((row, idx) => (
                    <motion.div
                      key={row}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.3 }}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: `translateZ(${idx * 2}px)`,
                      }}
                    >
                      <ParkingRow
                        rowLabel={row}
                        slots={slotsByRow[row]}
                        selectedSlot={selectedSlot}
                        maintenanceSlots={maintenanceSlots}
                        unsupportedSlots={unsupportedSlots}
                        activeReservations={activeReservations}
                        unavailableSlots={unavailableSlots}
                        interactive={interactive}
                        onSlotClick={handleSlotClick}
                        is3D={true}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Exit marker */}
          <EntryExitMarkers />

          {/* Footer */}
          <div className="mt-6 border-t border-slate-800/60 pt-5 flex items-center justify-between flex-wrap gap-4">
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">SELECTED POSITION</p>
              <p className="mt-1 font-mono text-xl font-black text-amber-500 uppercase tracking-wide">
                {selectedSlot || 'None Selected'}
              </p>
            </div>
            <button
              type="button"
              disabled={!selectedSlot}
              onClick={() => onConfirm?.()}
              className={`px-8 py-3 text-xs font-black uppercase tracking-widest rounded-full transition-all duration-300 ${
                selectedSlot
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_4px_15px_rgba(16,185,129,0.35)] scale-102 cursor-pointer'
                  : 'bg-slate-950/80 border border-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              Confirm Selection
            </button>
          </div>
        </>
      )}
    </div>
  );
}
