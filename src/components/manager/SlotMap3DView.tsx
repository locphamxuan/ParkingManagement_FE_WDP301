import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, RotateCcw, Zap } from 'lucide-react';
import { AnimatedParkingMap3D } from '@/components/map/AnimatedParkingMap3D';
import type { ParkingSlot } from '@/services/manager/managerApi';

// The 3D stage only has room to render one row of bays at a time — page through
// the rest instead of silently truncating (managers batch-create 20+ slots/floor).
const SLOTS_PER_PAGE = 10;

interface SlotMap3DViewProps {
  floorFilter: string;
  slotsByFloor: Record<string, ParkingSlot[]>;
  rx: number;
  rz: number;
  setRx: (v: number) => void;
  setRz: (v: number) => void;
  /** Danh sách slot đã lọc theo status/floor từ page cha (query BE) — component chỉ hiển thị. */
  items: ParkingSlot[];
  onEditSlot: (slot: ParkingSlot) => void;
  onOpenMultiSlot?: (qty?: number) => void;
}

/** Chế độ sơ đồ 3D của màn quản lý ô đỗ (hiển thị đồng nhất mô hình 3D Hologram với User). */
export function SlotMap3DView({
  floorFilter,
  slotsByFloor,
  rx,
  rz,
  setRx,
  setRz,
  items,
  onEditSlot,
  onOpenMultiSlot,
}: SlotMap3DViewProps) {
  const displayedSlots = floorFilter ? (slotsByFloor[floorFilter] || []) : items;
  const pageCount = Math.max(1, Math.ceil(displayedSlots.length / SLOTS_PER_PAGE));
  const [page, setPage] = useState(0);
  // Slot list (floor filter, status filter) changed — snap back to page 1 instead of
  // pointing at a now out-of-range page.
  useEffect(() => setPage(0), [floorFilter, displayedSlots.length]);
  const pagedSlots = displayedSlots.slice(page * SLOTS_PER_PAGE, (page + 1) * SLOTS_PER_PAGE);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,300px]">
      {/* 3D Map Viewport (Identical high-fidelity 3D Hologram Map model as User side) */}
      <div className="h-[620px] relative rounded-3xl overflow-hidden shadow-2xl group">
        <AnimatedParkingMap3D
          rotateX={rx}
          rotateZ={rz}
          interactive={true}
          slots={pagedSlots}
          onEditSlot={onEditSlot}
        />

        {/* Bay pager — the stage only fits one row of 10; page through the rest so
            no slot is silently hidden from the manager. */}
        {displayedSlots.length > SLOTS_PER_PAGE && (
          <div className="absolute top-16 right-6 z-20 flex items-center gap-2 bg-slate-950/80 border border-white/10 rounded-xl px-2 py-1.5 backdrop-blur-md shadow-lg">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Show previous bays"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono">
              Bays {page * SLOTS_PER_PAGE + 1}-{Math.min((page + 1) * SLOTS_PER_PAGE, displayedSlots.length)} / {displayedSlots.length}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              aria-label="Show next bays"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Quick Batch Creator Overlay Action Bar directly on 3D Map */}
        {onOpenMultiSlot && (
          <div className="absolute top-16 left-6 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenMultiSlot(5)}
              className="flex min-h-11 items-center gap-1.5 rounded-xl border border-blue-400/40 bg-blue-600/90 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 hover:bg-blue-500 active:scale-95"
            >
              <Plus size={12} className="stroke-[3]" /> +5 Slots
            </button>
            <button
              type="button"
              onClick={() => onOpenMultiSlot(10)}
              className="flex min-h-11 items-center gap-1.5 rounded-xl border border-blue-400/40 bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95"
            >
              <Zap size={12} className="text-amber-300 fill-amber-300" /> +10 Slots
            </button>
            <button
              type="button"
              onClick={() => onOpenMultiSlot(20)}
              className="min-h-11 rounded-xl border border-white/10 bg-slate-900/80 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-slate-200 shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 hover:border-white/20 hover:bg-slate-800 active:scale-95"
            >
              +20 Batch
            </button>
          </div>
        )}
      </div>

      {/* Sci-Fi Right Cockpit Control Panel */}
      <div className="glass-premium glow-border-pulse rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white font-mono mb-4 flex items-center gap-1.5 pb-2.5 border-b border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
            Spatial view
          </h3>

          {/* Cockpit Angle Tilt Controls */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                <span>Tilt X</span>
                <span className="text-blue-400 font-mono">{rx}°</span>
              </div>
              <input
                type="range"
                min="20"
                max="85"
                value={rx}
                onChange={(e) => setRx(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-600 border border-white/5"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                <span>Rotate Z</span>
                <span className="text-blue-400 font-mono">{rz}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={rz}
                onChange={(e) => setRz(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-600 border border-white/5"
              />
            </div>

            <button
              type="button"
              onClick={() => { setRx(60); setRz(-45); }}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-[9px] font-black uppercase tracking-widest text-white transition-all duration-300 hover:border-blue-500/30 hover:bg-slate-950/50"
            >
              <RotateCcw size={12} /> Reset View
            </button>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono mb-2">Status legend</div>
          
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/80 shadow-sm/5">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600/20" /> 
              Available
            </span>
            <span className="font-mono text-emerald-600 font-black">
              {displayedSlots.filter(s => s.status === 'available').length}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/80 shadow-sm/5">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-650/20" /> 
              Occupied
            </span>
            <span className="font-mono text-red-600 font-black">
              {displayedSlots.filter(s => s.status === 'occupied').length}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/80 shadow-sm/5">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-purple-650/20" /> 
              Reserved
            </span>
            <span className="font-mono text-purple-600 font-black">
              {displayedSlots.filter(s => s.status === 'reserved').length}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/80 shadow-sm/5">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600/20" /> 
              Maintenance
            </span>
            <span className="font-mono text-amber-600 font-black">
              {displayedSlots.filter(s => s.status === 'maintenance').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
