import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toast: Toast) => void;

let nextId = 1;
const listeners: Listener[] = [];

export function showToast(message: string, type: ToastType = 'success') {
  const toast: Toast = { id: nextId++, message, type };
  for (const listener of listeners) {
    listener(toast);
  }
}

const ICONS = {
  success: <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />,
  error: <XCircle size={16} className="shrink-0 text-rose-400" />,
  info: <Info size={16} className="shrink-0 text-sky-400" />,
};

const BORDER_CLASS = {
  success: 'border-emerald-500/20 bg-emerald-500/10',
  error: 'border-rose-500/20 bg-rose-500/10',
  info: 'border-sky-500/20 bg-sky-500/10',
};

const TEXT_CLASS = {
  success: 'text-emerald-200',
  error: 'text-rose-200',
  info: 'text-sky-200',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onRemove(toast.id), 3500);
    return () => window.clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-xl ${BORDER_CLASS[toast.type]}`}
      role="alert"
    >
      {ICONS[toast.type]}
      <span className={`flex-1 text-sm font-semibold ${TEXT_CLASS[toast.type]}`}>{toast.message}</span>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="ml-1 shrink-0 text-white/40 transition hover:text-white/80"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener: Listener = (toast) => {
      setToasts((prev) => [...prev, toast]);
    };
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  const remove = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-3rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={remove} />
      ))}
    </div>
  );
}
