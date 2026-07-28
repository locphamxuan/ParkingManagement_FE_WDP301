import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { fmtMoney, fmtShort, type BookingMode } from '@/pages/user/packageBookingHelper';

interface BookingFooterProps {
  startDateTime: Date | null;
  endDateTime: Date | null;
  estimatedAmount: number;
  canSubmit: boolean;
  isSubmitting: boolean;
  mode: BookingMode;
  onConfirm: () => void;
}

export function BookingFooter({
  startDateTime,
  endDateTime,
  estimatedAmount,
  canSubmit,
  isSubmitting,
  mode,
  onConfirm,
}: BookingFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-10px_28px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="hidden text-xs font-semibold text-slate-600 sm:block">
          {startDateTime && endDateTime ? (
            <>
              <span className="text-slate-900">Check-in:</span> {fmtShort(startDateTime)}
              <span className="mx-2 text-slate-600">—</span>
              <span className="text-slate-900">Check-out:</span> {fmtShort(endDateTime)}
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-emerald-700 font-black">{fmtMoney(estimatedAmount)}</span>
            </>
          ) : (
            'Select time and slot to pre-book'
          )}
        </div>
        <motion.button
          type="button"
          disabled={!canSubmit}
          onClick={onConfirm}
          whileHover={canSubmit ? { scale: 1.02 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
          className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none"
        >
          <span className="relative z-10 flex items-center gap-2">
            <ShieldCheck size={16} />
            {isSubmitting ? 'Processing...' : mode === 'hourly' ? 'Confirm Booking' : 'Buy Package'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
