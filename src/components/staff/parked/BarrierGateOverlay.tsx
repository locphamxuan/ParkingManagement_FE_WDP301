import { motion, AnimatePresence } from 'framer-motion';

export type BarrierState = 'closed' | 'opening' | 'open' | 'closing';

/** Full-screen IoT barrier-gate simulation shown while a vehicle is released. */
export function BarrierGateOverlay({ barrierState }: { barrierState: BarrierState }) {
  return (
    <AnimatePresence>
      {barrierState !== 'closed' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl space-y-6"
          >
            {/* Barrier Arm Animation Container */}
            <div className="relative h-32 w-full flex items-center justify-center overflow-hidden bg-slate-950/50 rounded-2xl border border-slate-800">
              {/* Gate Post */}
              <div className="absolute bottom-4 left-1/4 w-6 h-16 bg-slate-700 rounded-md border border-slate-600 z-10 flex flex-col justify-around items-center py-2">
                <div className={`w-3.5 h-3.5 rounded-full ${barrierState === 'open' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-amber-500 shadow-[0_0_12px_#f59e0b]'} transition-all duration-300`} />
                <div className="w-1.5 h-6 bg-slate-900 rounded" />
              </div>

              {/* Barrier Arm (Pole) */}
              <motion.div
                style={{ originX: 0.1, originY: 0.5 }}
                animate={{
                  rotate: barrierState === 'open' ? -90 : barrierState === 'opening' ? -45 : barrierState === 'closing' ? -45 : 0
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute bottom-10 left-1/4 w-40 h-3 bg-gradient-to-r from-slate-200 via-rose-500 to-rose-600 rounded-full border border-slate-900 z-20 origin-left flex justify-around animate-pulse"
              >
                <div className="w-4 h-full bg-white" />
                <div className="w-4 h-full bg-white" />
                <div className="w-4 h-full bg-white" />
              </motion.div>

              {/* Ground Line */}
              <div className="absolute bottom-4 left-0 right-0 h-1 bg-slate-800" />
            </div>

            {/* Status Message */}
            <div className="space-y-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                barrierState === 'open'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : barrierState === 'opening'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {barrierState === 'opening' && 'Gate opening...'}
                {barrierState === 'open' && 'Barrier Raised - Pass through'}
                {barrierState === 'closing' && 'Closing barrier...'}
              </span>

              <h3 className="text-lg font-black text-slate-100 uppercase tracking-wide">
                {barrierState === 'opening' && 'Releasing Vehicle...'}
                {barrierState === 'open' && 'Gate barrier open'}
                {barrierState === 'closing' && 'Security Gate warning'}
              </h3>

              <p className="text-xs text-slate-400 px-4">
                {barrierState === 'opening' && 'Triggering IoT controller. Gate is opening.'}
                {barrierState === 'open' && 'Please drive the vehicle forward slowly. The barrier will automatically close.'}
                {barrierState === 'closing' && 'Safety check complete. Closing gate arm.'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
