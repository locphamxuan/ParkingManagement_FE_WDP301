import { Plus, RotateCcw, Zap } from 'lucide-react';
import { AnimatedParkingMap3D } from '@/components/map/AnimatedParkingMap3D';
import type { Floor, ParkingSlot, VehicleType } from '@/services/manager/managerApi';

interface SlotMap3DViewProps {
  floors: Floor[];
  floorFilter: string;
  slotsByFloor: Record<string, ParkingSlot[]>;
  rx: number;
  rz: number;
  setRx: (v: number) => void;
  setRz: (v: number) => void;
  statusFilter: string;
  vehicleTypes: VehicleType[];
  items: ParkingSlot[];
  onEditSlot: (slot: ParkingSlot) => void;
  onOpenMultiSlot?: (qty?: number) => void;
}

/** Chế độ sơ đồ 3D của màn quản lý ô đỗ (hiển thị đồng nhất mô hình 3D Hologram với User). */
export function SlotMap3DView({
  floors,
  floorFilter,
  slotsByFloor,
  rx,
  rz,
  setRx,
  setRz,
  statusFilter,
  vehicleTypes,
  items,
  onEditSlot,
  onOpenMultiSlot,
}: SlotMap3DViewProps) {
  const displayedSlots = floorFilter ? (slotsByFloor[floorFilter] || []) : items;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,300px]">
      {/* 3D Map Viewport (Identical high-fidelity 3D Hologram Map model as User side) */}
      <div className="h-[620px] relative rounded-3xl overflow-hidden shadow-2xl group">
        <AnimatedParkingMap3D
          rotateX={rx}
          rotateZ={rz}
          interactive={true}
          slots={displayedSlots}
          onEditSlot={onEditSlot}
        />

        {/* Quick Batch Creator Overlay Action Bar directly on 3D Map */}
        {onOpenMultiSlot && (
          <div className="absolute top-16 left-6 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenMultiSlot(5)}
              className="px-3.5 py-2 rounded-xl bg-blue-600/90 border border-blue-400/40 text-white font-mono text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg hover:bg-blue-500 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={12} className="stroke-[3]" /> +5 Slots
            </button>
            <button
              type="button"
              onClick={() => onOpenMultiSlot(10)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-400/40 text-white font-mono text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap size={12} className="text-amber-300 fill-amber-300" /> +10 Slots
            </button>
            <button
              type="button"
              onClick={() => onOpenMultiSlot(20)}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-200 font-mono text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg hover:bg-slate-800 hover:border-white/20 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
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
              className="w-full py-2.5 rounded-xl border border-white/10 hover:border-blue-500/30 text-white font-mono text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 hover:bg-slate-950/50 cursor-pointer"
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
