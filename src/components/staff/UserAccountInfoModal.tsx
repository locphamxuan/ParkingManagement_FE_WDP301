import { X, User, Mail, Wallet, Car } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActiveSession {
  id: string;
  plateNumber: string;
  entryTime: string;
  fee?: number;
}

interface ScannedUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  walletBalance?: number;
  activeSessions?: ActiveSession[];
}

interface UserAccountInfoModalProps {
  user: ScannedUser;
  onClose: () => void;
}

export function UserAccountInfoModal({ user, onClose }: UserAccountInfoModalProps) {
  const formatMoney = (amount: number) =>
    amount.toLocaleString('vi-VN') + ' ₫';

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Thông tin tài khoản</p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">Kết quả quét QR</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{user.fullName}</p>
              {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail size={14} className="shrink-0" />
            <span>{user.email}</span>
          </div>

          <div className="flex items-center gap-2">
            <Wallet size={14} className="shrink-0 text-emerald-400" />
            <span className="text-sm">
              Số dư ví:{' '}
              <strong className="text-emerald-400">
                {formatMoney(user.walletBalance ?? 0)}
              </strong>
            </span>
          </div>
        </div>

        {/* Active sessions */}
        {user.activeSessions && user.activeSessions.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Xe đang gửi ({user.activeSessions.length})
            </p>
            <div className="space-y-2">
              {user.activeSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  <Car size={14} className="shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold text-foreground">{s.plateNumber}</p>
                    <p className="text-[11px] text-muted-foreground">Vào: {formatTime(s.entryTime)}</p>
                  </div>
                  {s.fee != null && s.fee > 0 && (
                    <span className="shrink-0 text-xs font-semibold text-amber-400">
                      {formatMoney(s.fee)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(!user.activeSessions || user.activeSessions.length === 0) && (
          <p className="mt-4 text-center text-xs text-muted-foreground">Không có xe đang gửi</p>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          Đóng
        </button>
      </motion.div>
    </div>
  );
}
