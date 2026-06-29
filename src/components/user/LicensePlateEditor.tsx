import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Bike, Car, CheckCircle2, Plus, X } from 'lucide-react';
import { brandsForVehicleType } from '@/utils/plate';

export interface EditablePlate {
  plateNumber: string;
  vehicleType: 'car' | 'motorcycle';
  brand?: string | null;
  isDefault?: boolean;
  _id?: string;
}

interface LicensePlateEditorProps {
  editPlates: EditablePlate[];
  maxPlates: number;
  vehicleType: 'car' | 'motorcycle';
  setVehicleType: (v: 'car' | 'motorcycle') => void;
  vehicleBrand: string;
  setVehicleBrand: (v: string) => void;
  customBrand: string;
  setCustomBrand: (v: string) => void;
  plateInput: string;
  setPlateInput: (v: string) => void;
  plateError: string | null;
  plateSuccess: string | null;
  setPlateError: (v: string | null) => void;
  plateInputRef: React.RefObject<HTMLInputElement>;
  onAddPlate: () => void;
  onRemovePlate: (plateNumber: string) => void;
  onSetDefault: (plate: EditablePlate) => void;
  onPlateKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function LicensePlateEditor({
  editPlates,
  maxPlates,
  vehicleType,
  setVehicleType,
  vehicleBrand,
  setVehicleBrand,
  customBrand,
  setCustomBrand,
  plateInput,
  setPlateInput,
  plateError,
  plateSuccess,
  setPlateError,
  plateInputRef,
  onAddPlate,
  onRemovePlate,
  onSetDefault,
  onPlateKeyDown,
}: LicensePlateEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Linked plates</label>
        <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full ${editPlates.length >= maxPlates
          ? 'bg-rose-500/15 text-rose-400'
          : 'bg-slate-800 text-slate-500'
          }`}>
          {editPlates.length}/{maxPlates} plates
        </span>
      </div>

      {/* Current Plate Tags */}
      <div className="min-h-[44px] flex flex-wrap gap-2 rounded-xl border border-white/10 bg-slate-950/80 p-2.5">
        <AnimatePresence>
          {editPlates.map((item) => (
            <motion.span
              key={item.plateNumber}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: -8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              whileHover={{ scale: 1.05 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-black text-xs tracking-wider shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] transition-all duration-300 border ${
                item.isDefault
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : item.vehicleType === 'car'
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                    : 'bg-purple-500/15 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
              }`}
            >
              {item.isDefault ? (
                <span className="text-xs animate-pulse">⭐</span>
              ) : item.vehicleType === 'car' ? (
                <Car size={11} className="text-blue-400" />
              ) : (
                <Bike size={11} className="text-purple-400" />
              )}
              <span>{item.plateNumber}</span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-sans font-extrabold tracking-normal uppercase ${
                item.isDefault
                  ? 'bg-amber-500/25 text-amber-300'
                  : item.vehicleType === 'car'
                    ? 'bg-blue-500/25 text-blue-300'
                    : 'bg-purple-500/25 text-purple-300'
              }`}>
                {item.isDefault ? 'Default' : item.vehicleType === 'car' ? 'Car' : 'Motorcycle'}
              </span>
              {item.brand && (
                <span className="text-[8px] px-1.5 py-0.5 rounded font-sans font-extrabold tracking-normal uppercase bg-slate-700/50 text-slate-300">
                  {item.brand}
                </span>
              )}
              {!item.isDefault && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.2 }}
                  onClick={() => onSetDefault(item)}
                  className="ml-1.5 rounded p-0.5 transition-all duration-150 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 animate-fadeIn"
                  title="Set as default"
                >
                  <span className="text-xs font-black">☆</span>
                </motion.button>
              )}
              <motion.button
                type="button"
                whileHover={{ scale: 1.2 }}
                onClick={() => onRemovePlate(item.plateNumber)}
                className={`ml-1 rounded p-0.5 transition-all duration-150 ${
                  item.isDefault
                    ? 'text-amber-400/60 hover:text-rose-400 hover:bg-rose-500/10'
                    : item.vehicleType === 'car'
                      ? 'text-blue-400/60 hover:text-rose-400 hover:bg-rose-500/10'
                      : 'text-purple-400/60 hover:text-rose-400 hover:bg-rose-500/10'
                }`}
                title={`Delete plate ${item.plateNumber}`}
              >
                <X size={11} className="stroke-[3]" />
              </motion.button>
            </motion.span>
          ))}
        </AnimatePresence>
        {editPlates.length === 0 && (
          <span className="text-[11px] text-slate-600 font-semibold italic self-center pl-1">No plates yet…</span>
        )}
      </div>

      {/* Add Plate Row */}
      {editPlates.length < maxPlates ? (
        <div className="space-y-3 p-4 rounded-2xl border border-white/5 bg-slate-900/20 shadow-inner">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Vehicle type:</span>
            <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10 w-fit">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setVehicleType('car'); setVehicleBrand(''); setCustomBrand(''); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                  vehicleType === 'car'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car size={12} />Car</motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setVehicleType('motorcycle'); setVehicleBrand(''); setCustomBrand(''); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                  vehicleType === 'motorcycle'
                    ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bike size={12} />Motorcycle</motion.button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono shrink-0">Brand:</span>
            <select
              value={vehicleBrand}
              onChange={(e) => {
                setVehicleBrand(e.target.value);
                if (e.target.value !== 'Other') setCustomBrand('');
              }}
              className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 text-white text-sm h-10 px-3 outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
            >
              <option value="">— Select brand (optional) —</option>
              {brandsForVehicleType(vehicleType).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Custom brand input — shown when user picks "Other" */}
          {vehicleBrand === 'Other' && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono shrink-0">Enter brand:</span>
              <input
                type="text"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                maxLength={50}
                placeholder="Enter your vehicle brand"
                className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 text-white placeholder-slate-600 text-sm h-10 px-3 outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                autoComplete="off"
              />
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={plateInputRef}
              type="text"
              value={plateInput}
              onChange={(e) => {
                setPlateInput(e.target.value.toUpperCase());
                setPlateError(null);
              }}
              onKeyDown={onPlateKeyDown}
              className={`flex-1 rounded-xl border bg-slate-950/80 text-white placeholder-slate-600 text-sm h-10 px-4 transition-all duration-300 outline-none font-mono tracking-wider ${
                vehicleType === 'car'
                  ? 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]'
              }`}
              placeholder="e.g. 59G2-038.80"
              maxLength={12}
              autoComplete="off"
              spellCheck={false}
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAddPlate}
              className={`px-4 h-10 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 inline-flex items-center gap-1.5 shrink-0 ${
                vehicleType === 'car'
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                  : 'bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
              }`}
            >
              <Plus size={14} className="stroke-[3]" />Add</motion.button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5">
          <AlertCircle size={14} className="text-rose-400 shrink-0" />
          <span className="text-[11px] text-rose-300 font-semibold">Reached the maximum of {maxPlates} plates. Remove one to add a new plate.</span>
        </div>
      )}

      {/* Validation error */}
      <AnimatePresence>
        {plateError && (
          <motion.div
            key="plate-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-950/20 px-3.5 py-2.5 text-[11px] font-semibold text-rose-400"
          >
            <AlertCircle size={13} className="shrink-0" />
            {plateError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success feedback */}
      <AnimatePresence>
        {plateSuccess && (
          <motion.div
            key="plate-success"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3.5 py-2.5 text-[11px] font-semibold text-emerald-400"
          >
            <CheckCircle2 size={13} className="shrink-0" />
            {plateSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">* Format: 2 digits + series (1 letter + 1 digit like<span className="font-mono text-slate-400">G2</span>, or 2 letters like<span className="font-mono text-slate-400">LD</span>) + a hyphen + 4-5 digits. e.g.:<span className="font-mono text-slate-400">59G2-03880</span>, <span className="font-mono text-slate-400">59G2-038.80</span>. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[8px]">Enter</kbd>or the Add button to confirm.</p>
    </div>
  );
}
