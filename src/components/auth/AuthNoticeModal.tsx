import { motion } from 'framer-motion';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthNoticeModalProps {
  modal: { type: string; title: string; message: string } | null;
  onClose: () => void;
}

/** Modal thông báo (quên/đặt lại mật khẩu) — success/error. */
export function AuthNoticeModal({ modal, onClose }: AuthNoticeModalProps) {
  if (!modal) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl border border-blue-200 bg-white p-6 text-center shadow-[0_20px_50px_-24px_rgba(37,99,235,0.35)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${
            modal.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
              : 'border-rose-200 bg-rose-50 text-rose-600'
          }`}
        >
          {modal.type === 'success' ? (
            <CheckCircle2 size={30} className="stroke-[2.2]" />
          ) : (
            <AlertCircle size={30} className="stroke-[2.2]" />
          )}
        </div>

        <h3 className="text-base font-black tracking-tight text-slate-900">{modal.title}</h3>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-[#576b85]">{modal.message}</p>

        <button
          type="button"
          onClick={onClose}
          className={`mt-5 h-12 w-full rounded-xl font-mono text-[11px] font-black uppercase tracking-[0.16em] transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/25 ${
            modal.type === 'success'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 hover:brightness-110'
              : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50'
          }`}
        >
          Got it
        </button>
      </motion.div>
    </div>
  );
}
