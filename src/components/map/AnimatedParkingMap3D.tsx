import { motion, useReducedMotion } from 'framer-motion';
import { CartoonCar3D } from './CartoonCar3D';
import { useParkingSimulation } from './useParkingSimulation';
import { Activity, Info, Zap } from 'lucide-react';

/**
 * `full` — bản đầy đủ cho HomePage & Manager (HUD, chọn ô, sửa ô).
 * `compact` — bản preview thu nhỏ (~240px) chỉ để trang trí: bỏ HUD, callout,
 * thao tác chọn/sửa ô; aria-hidden và không nhận tương tác.
 */
export type AnimatedParkingMap3DVariant = 'full' | 'compact';

export interface AnimatedParkingMap3DProps {
  variant?: AnimatedParkingMap3DVariant;
  rotateX?: any;
  rotateZ?: any;
  scale?: any;
  x?: any;
  y?: any;
  interactive?: boolean;
  selectedSlot?: string | null;
  interactiveUnavailableSlots?: string[];
  onSlotClick?: (slotCode: string) => void;
  slots?: Array<{
    _id?: string;
    code: string;
    status: 'available' | 'occupied' | 'reserved' | 'maintenance' | string;
    vehicleType?: any;
    note?: string;
  }>;
  onEditSlot?: (slot: any) => void;
}

export function AnimatedParkingMap3D({
  variant = 'full',
  rotateX,
  rotateZ,
  scale,
  x,
  y,
  interactive = false,
  selectedSlot = null,
  interactiveUnavailableSlots = [],
  onSlotClick,
  slots = [],
  onEditSlot,
}: AnimatedParkingMap3DProps = {}) {
  const compact = variant === 'compact';
  const prefersReducedMotion = useReducedMotion();
  // Decorative previews remain static to avoid wasting CPU/GPU on auth pages.
  // The full simulation also respects the user's reduced-motion preference.
  const paused = compact || Boolean(prefersReducedMotion);

  const {
    hudMessage, simPhase,
    gateAOpen, gateBOpen,
    carAState, carBState,
    smokeParticles,
    controlsCarA, controlsCarB,
  } = useParkingSimulation(interactive, paused);

  const showSimCars = !interactive && !paused;

  return (
    <div
      aria-hidden={compact || undefined}
      className={
        compact
          ? 'relative h-[240px] w-full overflow-hidden rounded-xl bg-slate-950 sm:h-[260px] pointer-events-none select-none'
          : 'relative h-[430px] w-full overflow-hidden rounded-3xl border border-white/5 bg-slate-950 p-3 shadow-2xl sm:h-[520px] sm:p-5 lg:h-[600px]'
      }
    >

      {/* Blueprint Grid Lines Backing */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none" />

      {/* Cyberpunk HUD Indicator Top */}
      {!compact && (
        <div className="relative z-10 flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/60 px-3 py-2.5 shadow-lg backdrop-blur-md border-glow-neon sm:px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
              <Activity size={12} className="text-orange-400" />
              <span className="hidden sm:inline">
                {interactive ? '3D INTERACTIVE BOOKING MAP' : 'LIVE SIMULATION V3.0'}
              </span>
              <span className="sm:hidden">{interactive ? '3D SLOT MAP' : 'LIVE MAP'}</span>
            </span>
          </div>
          <span className="text-[9px] font-mono font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-widest">
            {interactive ? 'SELECT SLOT' : 'ACTIVE MAP'}
          </span>
        </div>
      )}

      {/* High-Fidelity Smart City Isometric Arena */}
      <div
        className="relative flex h-full w-full flex-1 items-center justify-center perspective-1000 preserve-3d"
      >
        
        {/* High-Fidelity Smart City Isometric Arena */}

        <div
          className={
            compact
              ? 'relative flex h-[280px] w-[500px] shrink-0 origin-center scale-[0.76] items-center justify-center sm:scale-[0.9]'
              : 'relative flex h-[300px] w-[520px] shrink-0 origin-center scale-[0.68] items-center justify-center sm:scale-[0.82] md:scale-[0.96] lg:scale-100'
          }
        >
        <motion.div
          style={{
            transformStyle: 'preserve-3d',
            width: '450px',
            height: '240px',
            rotateX: rotateX ?? 55,
            rotateZ: rotateZ ?? -45,
            scale: scale ?? 1,
            x: x ?? 0,
            y: y ?? 0,
          }}
          className="relative preserve-3d"
        >
          {/* Architectural Asphalt Concrete Platform SVG Base */}
          <svg viewBox="0 0 450 240" className="absolute inset-0 w-full h-full overflow-visible z-0">
            <defs>
              {/* High-fidelity dark asphalt roadbed texture */}
              <linearGradient id="asphaltRoad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2d3748" />
                <stop offset="100%" stopColor="#1a202c" />
              </linearGradient>
              <linearGradient id="concreteSide" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1f2937" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <radialGradient id="evShield" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Extruded Concrete Slab Sides (simulating solid block thickness) */}
            <polygon points="0,220 450,220 450,236 0,236" fill="url(#concreteSide)" opacity="0.95" />
            
            {/* Dark Asphalt Roadbed Ground top face */}
            <polygon points="0,20 450,20 450,220 0,220" fill="url(#asphaltRoad)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            {/* Solid White Concrete Curbs surrounding asphalt borders */}
            <polygon points="0,20 450,20 450,23 0,23" fill="#e2e8f0" opacity="0.9" />
            <polygon points="0,217 450,217 450,220 0,220" fill="#e2e8f0" opacity="0.9" />

            {/* Thick 3D Curb Warning Stripes at the edge border */}
            <polygon points="0,218 450,218 450,221 0,221" fill="repeating-linear-gradient(45deg, #fbbf24, #fbbf24 6px, #0f172a 6px, #0f172a 12px)" />

            {/* Safety Guardrails (Volumetric steel tubing with support pillars and base mounts) */}
            <g opacity="0.8">
              {/* Vertical support pillars */}
              {[10, 80, 150, 220, 290, 360, 430].map(xVal => (
                <g key={xVal}>
                  {/* Pillar Shadow */}
                  <line x1={xVal - 0.5} y1="20" x2={xVal - 0.5} y2="4" stroke="#020617" strokeWidth="3" opacity="0.5" />
                  {/* Pillar Front */}
                  <line x1={xVal} y1="20" x2={xVal} y2="4" stroke="#cbd5e1" strokeWidth="2" />
                  {/* Circular metallic mount base */}
                  <ellipse cx={xVal} cy="20" rx="3.5" ry="1.8" fill="#475569" stroke="#cbd5e1" strokeWidth="0.5" />
                </g>
              ))}
              {/* Dual Guardrail tubes with linear gradient steel texture */}
              <line x1="0" y1="8" x2="450" y2="8" stroke="#475569" strokeWidth="2.5" />
              <line x1="0" y1="4" x2="450" y2="4" stroke="#f1f5f9" strokeWidth="1.5" />
            </g>

            {/* Lanes markings (dashed white-ish lines with subtle glowing drop shadows) */}
            <line x1="0" y1="135" x2="450" y2="135" stroke="rgba(255,255,255,0.18)" strokeWidth="2" strokeDasharray="6 8" />

            {/* Road Lane Ground Labels (Entry Lane & Exit Lane) */}
            <text x="25" y="150" fill="#06b6d4" fontSize="8" fontWeight="bold" fontFamily="monospace" letterSpacing="1.2" opacity="0.9">ENTRY LANE ➔</text>
            <text x="330" y="150" fill="#f43f5e" fontSize="8" fontWeight="bold" fontFamily="monospace" letterSpacing="1.2" opacity="0.9">➔ EXIT LANE</text>

            {/* Yellow parking lane boundaries */}
            {[20, 105, 190, 275, 360, 445].map((xPos) => (
              <path key={xPos} d={`M ${xPos},20 L ${xPos},85`} stroke="#fbbf24" strokeWidth="2.5" opacity="0.85" />
            ))}
            
            {/* White ground directional arrows */}
            <path d="M 160,170 L 190,170 M 180,165 L 190,170 L 180,175" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 260,170 L 290,170 M 280,165 L 290,170 L 280,175" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Curved trajectory guide arrow (Teal Sedan reversing path into Slot 3) */}
            {simPhase === 1 && (
              <motion.g 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, times: [0, 0.15, 0.85, 1] }}
              >
                {/* Curved dotted line */}
                <path 
                  d="M 140,160 Q 210,140 215,65" 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="1.8" 
                  strokeDasharray="3 3" 
                />
                {/* Arrow head */}
                <path 
                  d="M 211,72 L 215,65 L 219,72" 
                  fill="none" 
                  stroke="#fbbf24" 
                  strokeWidth="1.8" 
                  strokeLinecap="round"
                />
              </motion.g>
            )}

            {/* EV charging pulsing glowing shield under Slot 3 */}
            {simPhase === 1 && carAState === 'parked' && (
              <g transform="translate(190, 25)">
                <motion.ellipse 
                  cx="32" cy="22" 
                  initial={{ rx: 24, ry: 14, opacity: 0.35 }}
                  animate={{ rx: [24, 30, 24], ry: [14, 18, 14], opacity: [0.35, 0.65, 0.35] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  fill="url(#evShield)" 
                />
                <circle cx="32" cy="22" r="14" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.8" />
              </g>
            )}

            {/* Highly Detailed Volumetric 3D EV Charging Station Post block */}
            <g transform="translate(208, 0)" opacity="0.95">
              {/* Volumetric shadow of post */}
              <polygon points="4,16 16,16 14,20 2,20" fill="#020617" opacity="0.4" />
              {/* 3D Base plate */}
              <polygon points="5,14 15,14 13,17 3,17" fill="#334155" stroke="#475569" strokeWidth="0.5" />
              {/* Post vertical body (with 3D shaded front and side) */}
              <path d="M 7,2 L 11,2 L 11,14 L 7,14 Z" fill="#0284c7" />
              <path d="M 11,2 L 13,3 L 13,14 L 11,14 Z" fill="#0369a1" />
              {/* Glowing LED display screen */}
              <rect x="7.5" y="4" width="3" height="3.5" rx="0.5" fill="#0f172a" stroke="#0ea5e9" strokeWidth="0.5" />
              <circle cx="9" cy="5.8" r="0.8" fill="#10b981" className="animate-pulse" />
              {/* Power plug connector & cute coiled cable linking to Slot 3 */}
              <path d="M 12.5,7 C 16,10 24,8 24,18" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <circle cx="24" cy="18" r="2.2" fill="#0284c7" stroke="#0ea5e9" strokeWidth="0.5" />
            </g>
          </svg>

          {/* Solid 3D security gate pillars (black pillars with glowing red LEDs at the top) */}
          {/* Left Entry Security Gate (Tilted open at 45 degrees) */}
          <div 
            className="absolute left-[-18px] top-[140px] preserve-3d" 
            style={{ 
              width: '12px', 
              height: '12px', 
              transform: 'translateZ(0px)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Floating Entry Gate Label Badge */}
            <div
              className={`absolute top-[-25px] z-30 font-mono text-[8px] font-black uppercase text-emerald-300 bg-slate-950/90 border border-emerald-500/40 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.3)] flex items-center gap-1 pointer-events-none ${compact ? 'left-[-14px]' : 'left-[-30px]'}`}
              style={{ transform: 'translateZ(35px)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{compact ? 'IN' : 'CỔNG VÀO (IN)'}</span>
            </div>

            {/* Volumetric black scanner body */}
            <div 
              className="box-3d w-full h-full preserve-3d"
              style={{
                '--box-w': '12px',
                '--box-d': '12px',
                '--box-h': '36px',
                transformStyle: 'preserve-3d'
              } as React.CSSProperties}
            >
              {/* Top Face (Glowing red status bulb) */}
              <div className="box-3d-face box-3d-top bg-slate-950 border border-slate-800 rounded-sm flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
              </div>
              {/* Other black faces */}
              <div className="box-3d-face box-3d-front bg-slate-900 border-b border-black/40" />
              <div className="box-3d-face box-3d-right bg-slate-900" />
              <div className="box-3d-face box-3d-back bg-slate-900" />
              <div className="box-3d-face box-3d-left bg-slate-900" />
            </div>

            {/* Red/White striped gate arm (entrance gate tilted at 45 degrees, opens to 85) */}
            <div 
              className="absolute left-3.5 top-1.5 w-[50px] h-2.5 bg-red-500 origin-left transition-transform duration-500 shadow-lg preserve-3d"
              style={{ 
                transform: gateAOpen ? 'rotateZ(-85deg) translateZ(28px)' : 'rotateZ(-45deg) translateZ(28px)',
                transformOrigin: 'left center',
                backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 6px, #ffffff 6px, #ffffff 12px)',
                border: '1.5px solid #b91c1c',
                borderRadius: '2px'
              }} 
            />
          </div>

          {/* Right Exit Security Gate (Closed horizontal by default) */}
          <div 
            className="absolute right-[-18px] top-[140px] preserve-3d" 
            style={{ 
              width: '12px', 
              height: '12px', 
              transform: 'translateZ(0px)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Floating Exit Gate Label Badge */}
            <div
              className={`absolute top-[-25px] z-30 font-mono text-[8px] font-black uppercase text-rose-300 bg-slate-950/90 border border-rose-500/40 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(244,63,94,0.3)] flex items-center gap-1 pointer-events-none ${compact ? 'right-[-16px]' : 'right-[-30px]'}`}
              style={{ transform: 'translateZ(35px)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              <span>{compact ? 'OUT' : 'CỔNG RA (OUT)'}</span>
            </div>

            <div 
              className="absolute right-3.5 top-1.5 w-[50px] h-2.5 bg-red-500 origin-right transition-transform duration-500 shadow-lg preserve-3d"
              style={{ 
                transform: gateBOpen ? 'rotateZ(85deg) translateZ(28px)' : 'rotateZ(0deg) translateZ(28px)',
                transformOrigin: 'right center',
                backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 6px, #ffffff 6px, #ffffff 12px)',
                border: '1.5px solid #b91c1c',
                borderRadius: '2px'
              }} 
            />
          </div>

          {/* Render Parking slots with stoppers & visual 3D cars */}
          <div className="absolute top-[20px] left-[20px] right-[20px] h-[70px] flex flex-wrap items-center justify-center gap-3.5 preserve-3d">
            {(slots && slots.length > 0 ? slots.slice(0, 10) : [1, 2, 3, 4, 5]).map((item, index) => {
              const id = index + 1;
              const isRawSlot = typeof item === 'object' && item !== null;
              const rawSlot = isRawSlot ? (item as any) : null;
              const slotCode = rawSlot ? rawSlot.code : `A-0${id}`;
              const isEV = id === 3 || slotCode.toLowerCase().includes('ev');

              // Detect if this slot belongs to a motorcycle floor/zone
              const isMotoSlot = (() => {
                if (!rawSlot) return false;
                const vt = rawSlot.vehicleType;
                if (!vt) return false;
                const vtStr = typeof vt === 'string'
                  ? vt
                  : (vt.code || vt.name || vt._id || '').toString();
                return /moto|motorcycle|xe.may|xemay|motorbike/i.test(vtStr);
              })();
              
              const blockedBySlotStatus = interactiveUnavailableSlots.includes(slotCode);
              
              const isOccupied = rawSlot 
                ? rawSlot.status === 'occupied' 
                : (interactive 
                  ? blockedBySlotStatus
                  : (id === 1 || id === 2 || (id === 3 && carAState === 'parked') || (id === 4 && carBState === 'parked') || id === 5));
              const isReserved = rawSlot ? rawSlot.status === 'reserved' : false;
              const isMaintenance = rawSlot ? rawSlot.status === 'maintenance' : false;
              const isSelected = interactive && selectedSlot === slotCode;

              const carTypes: Array<'sedan' | 'suv' | 'offroad' | 'crossover'> = ['sedan', 'suv', 'offroad', 'crossover'];
              const carColors = ['#0e7490', '#be185d', '#334155', '#eab308', '#059669', '#d97706'];

              return (
                <motion.div
                  key={rawSlot?._id || slotCode || id}
                  onClick={compact ? undefined : () => {
                    if (onEditSlot && rawSlot) {
                      onEditSlot(rawSlot);
                    } else if (interactive && !isOccupied && onSlotClick) {
                      onSlotClick(slotCode);
                    }
                  }}
                  whileHover={compact ? undefined : {
                    scale: 1.06,
                    boxShadow: isOccupied ? '0 0 15px rgba(244,63,94,0.5)' : '0 0 15px rgba(16,185,129,0.5)',
                  }}
                  whileTap={compact ? undefined : { scale: 0.95 }}
                  className={`w-[66px] h-[46px] rounded-xl border flex flex-col justify-between p-1.5 relative shadow-2xl transition-all duration-300 ${compact ? 'cursor-default' : 'cursor-pointer'} ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.6)] scale-105 z-20'
                      : isOccupied
                      ? 'border-rose-500/80 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : isReserved
                      ? 'border-purple-500/80 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : isMaintenance
                      ? 'border-amber-500/80 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:border-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  {/* EV Slot specific header glow */}
                  {isEV && (
                    <div className="absolute inset-0 border border-cyan-500/20 rounded-xl bg-cyan-500/5 flex items-center justify-center pointer-events-none">
                      <Zap size={10} className="text-cyan-400 opacity-60 absolute top-1 right-1" />
                    </div>
                  )}
                  
                  {/* Yellow-and-Black striped Stopper bump guard */}
                  <div 
                    className="absolute top-1 left-2.5 right-2.5 h-[3px] rounded-xs pointer-events-none"
                    style={{
                      transform: 'translateZ(1.5px)',
                      backgroundImage: 'repeating-linear-gradient(45deg, #fbbf24, #fbbf24 3px, #0f172a 3px, #0f172a 6px)',
                      border: '0.5px solid #78350f'
                    }}
                  />
                  
                  <div className="flex justify-between items-center z-10 font-mono text-[8px] text-slate-500 font-extrabold uppercase mt-2 pointer-events-none">
                    <span className="truncate max-w-[42px]">{slotCode}</span>
                    {isOccupied && <span className="text-rose-400 font-bold text-[7px] uppercase tracking-normal">FULL</span>}
                    {isReserved && <span className="text-purple-400 font-bold text-[7px] uppercase tracking-normal">RSVD</span>}
                    {isMaintenance && <span className="text-amber-400 font-bold text-[7px] uppercase tracking-normal">MAINT</span>}
                    {!isOccupied && !isReserved && !isMaintenance && <span className="text-emerald-400 font-bold text-[7px] uppercase tracking-normal">FREE</span>}
                  </div>
                  
                  {/* Render vehicle icon in occupied slots — motorcycle emoji for moto slots, CartoonCar3D for car slots.
                      In simulation mode, slots 3 & 4 are reserved for dynamic Car A & Car B to avoid double-rendering */}
                  {isOccupied && (!showSimCars || (id !== 3 && id !== 4)) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: 'translateZ(4px)' }}>
                      {isMotoSlot ? (
                        <div style={{ fontSize: '20px', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🏍️</div>
                      ) : (
                        <CartoonCar3D 
                          type={carTypes[index % carTypes.length]} 
                          color={carColors[index % carColors.length]} 
                          state="parked" 
                        />
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Floating exhaust smoke particles */}
          {showSimCars && smokeParticles.map((p) => (
            <motion.span 
              key={p.id}
              initial={{ scale: 0.3, opacity: 0.8, z: 6 }}
              animate={{ scale: 1.8, opacity: 0, z: 20 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute w-2 h-2 rounded-full bg-slate-500/30 filter blur-[0.5px]"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`
              }}
            />
          ))}

          {/* ANIMATED CARS IN SIMULATION */}
          {/* CAR A (Teal Sedan) */}
          {showSimCars && (
            <motion.div 
              animate={controlsCarA}
              className="absolute preserve-3d"
              style={{
                width: '56px',
                height: '36px',
                left: '0px',
                top: '0px',
                transformStyle: 'preserve-3d',
                willChange: 'transform'
              }}
            >
              <CartoonCar3D type="sedan" color="#0e7490" state={carAState} />
              
              {/* Dynamic Conical Headlight Beams */}
              {carAState === 'driving' && (
                <div className="absolute overflow-visible pointer-events-none" style={{ left: '54px', top: '10px', width: '50px', height: '16px', transform: 'translateZ(3px)' }}>
                  <svg className="w-full h-full overflow-visible" opacity="0.35">
                    <polygon points="0,8 50,0 50,16" fill="rgba(254, 240, 138, 0.75)" filter="blur(1.5px)" />
                  </svg>
                </div>
              )}

              {/* Holographic HUD Callout pinned to Teal Sedan roof (when driving) */}
              {!compact && carAState === 'driving' && (
                <div className="absolute overflow-visible pointer-events-none" style={{ top: 0, left: 0, width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
                  {/* SVG dashed leader line */}
                  <svg className="absolute overflow-visible pointer-events-none z-30" style={{ top: -75, left: -25, width: 80, height: 80 }}>
                    <path 
                      d="M 15,10 Q 55,35 44,70" 
                      fill="none" 
                      stroke="#06b6d4" 
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      className="animate-pulse"
                    />
                    <circle cx="44" cy="70" r="3" fill="#06b6d4" className="shadow-[0_0_8px_#06b6d4]" />
                  </svg>

                  {/* Counter-rotated HUD Card facing user */}
                  <div 
                    className="absolute border border-cyan-500/40 rounded-xl p-2.5 tracking-wider uppercase font-mono shadow-2xl flex flex-col gap-0.5 pointer-events-auto backdrop-blur-md"
                    style={{
                      width: '135px',
                      height: '52px',
                      left: '-105px',
                      top: '-120px',
                      transform: 'rotateZ(45deg) rotateX(-55deg) scale(0.95)',
                      transformOrigin: 'bottom right',
                      background: 'rgba(15, 23, 42, 0.92)',
                      boxShadow: '0 8px 32px 0 rgba(6, 182, 212, 0.3)',
                    }}
                  >
                    <div className="flex justify-between items-center text-[9px] font-black text-white border-b border-cyan-500/20 pb-1 mb-1">
                      <span>TEAL_SEDAN_EV</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    </div>
                    <div className="text-[7.5px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_#10b981]" />
                      SYS: AUTOPARK_ALIGN
                    </div>
                    <div className="text-[7.5px] font-bold text-cyan-300/80">
                      BATTERY: 81%
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* CAR B (Fuchsia SUV) */}
          {showSimCars && (
            <motion.div 
              animate={controlsCarB}
              className="absolute preserve-3d"
              style={{
                width: '58px',
                height: '38px',
                left: '0px',
                top: '0px',
                transformStyle: 'preserve-3d',
                willChange: 'transform'
              }}
            >
              <CartoonCar3D type="suv" color="#be185d" state={carBState} />

              {/* Dynamic Conical Headlight Beams */}
              {carBState === 'driving' && (
                <div className="absolute overflow-visible pointer-events-none" style={{ left: '56px', top: '11px', width: '50px', height: '16px', transform: 'translateZ(3.5px)' }}>
                  <svg className="w-full h-full overflow-visible" opacity="0.35">
                    <polygon points="0,8 50,0 50,16" fill="rgba(254, 240, 138, 0.75)" filter="blur(1.5px)" />
                  </svg>
                </div>
              )}

              {/* Holographic HUD Callout pinned to Fuchsia SUV roof (only when driving/exiting) */}
              {!compact && carBState === 'driving' && (
                <div className="absolute overflow-visible pointer-events-none" style={{ top: 0, left: 0, width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
                  
                  {/* SVG curved cyan leader line */}
                  <svg className="absolute overflow-visible pointer-events-none z-30" style={{ top: -75, left: -25, width: 80, height: 80 }}>
                    <path 
                      d="M 15,10 Q 55,35 44,70" 
                      fill="none" 
                      stroke="#06b6d4" 
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      className="animate-pulse"
                    />
                    {/* Glowing Cyan anchor dot pinned to the roof */}
                    <circle cx="44" cy="70" r="3" fill="#06b6d4" className="shadow-[0_0_8px_#06b6d4]" />
                  </svg>

                  {/* Counter-rotated HUD Card facing the user perfectly */}
                  <div 
                    className="absolute glass-panel border border-cyan-500/40 rounded-xl p-2.5 tracking-wider uppercase font-mono shadow-2xl flex flex-col gap-0.5 pointer-events-auto"
                    style={{
                      width: '135px',
                      height: '52px',
                      left: '-105px',
                      top: '-120px',
                      transform: 'rotateZ(45deg) rotateX(-55deg) scale(0.95)',
                      transformOrigin: 'bottom right',
                      background: 'rgba(15, 23, 42, 0.85)',
                      boxShadow: '0 8px 32px 0 rgba(6, 182, 212, 0.25)',
                      borderColor: 'rgba(6, 182, 212, 0.4)'
                    }}
                  >
                    <div className="flex justify-between items-center text-[9px] font-black text-white border-b border-cyan-500/20 pb-1 mb-1">
                      <span>FUCHSIA_SUV_99</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    </div>
                    <div className="text-[7.5px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_#10b981]" />
                      STS: DISPATCH_ENGAGED
                    </div>
                    <div className="text-[7.5px] font-bold text-cyan-300/80">
                      TRAKS: SCAN_CLEAR_OK
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </motion.div>
        </div>
      </div>

      {/* Cyber HUD Status Panel */}
      {!compact && (
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-start gap-2.5 rounded-xl border border-orange-500/30 border-l-4 border-l-orange-500 bg-slate-950/85 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:border-orange-500/50 sm:bottom-4 sm:left-auto sm:right-4 sm:w-[280px]">
          <Info size={14} className="text-orange-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-0.5">
            <p className="text-[8px] font-black uppercase text-slate-400 font-mono tracking-wider flex items-center gap-1.5">Operating status<span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </p>
            <p className="text-[11px] font-bold text-slate-200 leading-snug tracking-wide">{hudMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
}
