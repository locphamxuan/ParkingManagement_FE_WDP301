import { motion } from 'framer-motion';
import { Layers, RotateCcw } from 'lucide-react';
import { Slot3DBox } from '@/components/parking/Slot3DBox';
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
}

/** Chế độ sơ đồ 3D của màn quản lý ô đỗ (viewport 3D xếp tầng + cockpit chỉnh góc nhìn). */
export function SlotMap3DView({
  floors, floorFilter, slotsByFloor, rx, rz, setRx, setRz, statusFilter, vehicleTypes, items, onEditSlot,
}: SlotMap3DViewProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,300px]">

      {/* 3D Map Viewport */}
      <div className="h-[620px] relative rounded-3xl border border-orange-500/15 bg-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(0,0,0,0.6)] overflow-hidden flex items-center justify-center glass-premium cyber-scanline">

        {/* Multi-layer space backing grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.018)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
        {/* Radial dot texture */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
        {/* Central orange halo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.07),rgba(168,85,247,0.035)_50%,transparent_75%)] pointer-events-none" />

        {/* 3D Render Stack Container */}
        <div className="perspective-1000 w-full h-full flex items-center justify-center preserve-3d">
          <motion.div
            style={{
              rotateX: rx,
              rotateZ: rz,
              transformStyle: 'preserve-3d',
            }}
            className="isometric-mesh relative w-[500px] h-[400px] preserve-3d transition-transform duration-200"
          >
            {/* Render Floors stacked dynamically */}
            {floors.map((floor, fIdx) => {
              // Apply filter check
              if (floorFilter && floor._id !== floorFilter) return null;

              const floorSlots = slotsByFloor[floor._id] || [];
              // Vertical offset layout for vertical stacking
              const zOffset = floorFilter ? 0 : (fIdx * 130);

              return (
                <motion.div
                  key={floor._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: fIdx * 0.06, type: 'spring', stiffness: 120, damping: 18 }}
                  style={{
                    transform: `translateZ(${zOffset}px)`,
                    transformStyle: 'preserve-3d',
                  }}
                  className="absolute inset-0 rounded-3xl border border-cyan-500/25 bg-slate-900/55 shadow-[0_0_30px_rgba(6,182,212,0.08),0_8px_32px_rgba(0,0,0,0.6)] preserve-3d p-6 flex flex-col justify-between overflow-hidden"
                >
                  {/* Floor plate cyan scan stripe — stays behind content */}
                  <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none"
                    style={{ top: `${((fIdx % 3) + 1) * 25}%` }}
                  />
                  {/* Floor label badge */}
                  <div className="flex justify-between items-center mb-4 z-10 preserve-3d" style={{ transform: 'translateZ(15px)' }}>
                    <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-white/5">
                      FLOOR {floor.code}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 font-mono">
                      CAPACITY: {floorSlots.filter(s => s.status === 'occupied').length}/{floorSlots.length} SLOTS
                    </span>
                  </div>

                  {/* Grid Layout of Slot blocks */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-6 my-auto items-center justify-items-center preserve-3d" style={{ transform: 'translateZ(10px)' }}>
                    {floorSlots.length === 0 ? (
                      <div className="col-span-full text-center text-slate-600 text-xs py-10 uppercase tracking-widest font-mono">No slots configured</div>
                    ) : (
                      floorSlots.map((slot) => (
                        <Slot3DBox
                          key={slot._id}
                          slot={slot}
                          onClick={() => onEditSlot(slot)}
                          statusFilter={statusFilter}
                          vehicleTypes={vehicleTypes}
                        />
                      ))
                    )}
                  </div>

                  <div className="text-[8px] text-slate-600 font-black tracking-widest uppercase font-mono text-right preserve-3d mt-4" style={{ transform: 'translateZ(5px)' }}>
                    {floor.code} ARCHITECTURE
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Ambient occlusion glow labels */}
        <div className="absolute left-6 top-6 flex flex-col gap-1.5 z-20 pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <Layers size={12} className="text-orange-400" />
            <span>3D Zone Map ({items.length} slots)</span>
          </div>
        </div>
      </div>

      {/* Sci-Fi Right Cockpit Control Panel */}
      <div className="glass-premium glow-border-pulse rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white font-mono mb-4 flex items-center gap-1.5 pb-2.5 border-b border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            Spatial view
          </h3>

          {/* Cockpit Angle Tilt Controls */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                <span>Tilt X</span>
                <span className="text-orange-400 font-mono">{rx}°</span>
              </div>
              <input
                type="range"
                min="20"
                max="85"
                value={rx}
                onChange={(e) => setRx(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500 border border-white/5"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                <span>Rotate Z</span>
                <span className="text-orange-400 font-mono">{rz}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={rz}
                onChange={(e) => setRz(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500 border border-white/5"
              />
            </div>

            <button
              onClick={() => { setRx(60); setRz(-45); }}
              className="w-full py-2.5 rounded-xl border border-white/10 hover:border-orange-500/30 text-white font-mono text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 hover:bg-slate-950/50"
            >
              <RotateCcw size={12} /> Reset View
            </button>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/5 space-y-3">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono mb-2">Status legend</div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" /> Available</span>
            <span className="font-mono text-emerald-400 font-black">
              {items.filter(s => s.status === 'available').length}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/40" /> Occupied</span>
            <span className="font-mono text-red-400 font-black">
              {items.filter(s => s.status === 'occupied').length}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-purple-500/20 border border-purple-500/40" /> Reserved</span>
            <span className="font-mono text-purple-400 font-black">
              {items.filter(s => s.status === 'reserved').length}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
            <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/30" /> Maintenance</span>
            <span className="font-mono text-amber-400 font-black">
              {items.filter(s => s.status === 'maintenance').length}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
