import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, Loader2, MessageCircleReply, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserNotifications } from '@/hooks/useFeedbackNotifications';
import type { UserNotification } from '@/services/feedbackNotificationService';

interface NotificationBellProps {
  enabled?: boolean;
}

function isUnread(item: UserNotification) {
  return item.isRead === false || item.read === false;
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}

function getMessage(item: UserNotification) {
  const raw = item.message || item.body || 'Admin da phan hoi danh gia cua ban.';
  if (item.type === 'feedback_reply' && !raw.toLowerCase().includes('admin')) {
    return `Phan hoi tu Admin: ${raw}`;
  }
  return raw;
}

export default function NotificationBell({ enabled = true }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const { items, unread, loading, error, markRead, refresh } = useUserNotifications(enabled);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleOpen = () => {
    setOpen((value) => !value);
    if (!open) refresh();
  };

  const handleRead = async (item: UserNotification) => {
    const id = item._id || item.id;
    if (id && isUnread(item)) await markRead(id);
    setOpen(false);
  };

  if (!enabled) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900/70 text-slate-300 shadow-lg shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-400/30 hover:bg-slate-800 hover:text-orange-300"
        aria-label="Thong bao"
      >
        <Bell size={16} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-4 ring-slate-950">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-md"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Thong bao</p>
                <p className="text-[11px] font-semibold text-slate-500">Phan hoi tu quan tri vien</p>
              </div>
              {loading ? <Loader2 size={15} className="animate-spin text-slate-500" /> : <Sparkles size={15} className="text-amber-300" />}
            </div>

            {error ? (
              <div className="m-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-xs font-bold text-rose-200">{error}</div>
            ) : null}

            <div className="max-h-80 overflow-auto pr-1">
              {items.length ? (
                items.slice(0, 50).map((item) => {
                  const unreadItem = isUnread(item);
                  return (
                    <button
                      key={item._id || item.id || item.createdAt}
                      type="button"
                      onClick={() => handleRead(item)}
                      className={`mb-2 w-full rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${unreadItem ? 'border-orange-400/25 bg-orange-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-xl p-2 ${unreadItem ? 'bg-orange-500/15 text-orange-300' : 'bg-slate-800 text-slate-400'}`}>
                          {unreadItem ? <MessageCircleReply size={15} /> : <CheckCircle2 size={15} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-black text-white">{item.title || 'Phan hoi tu Admin'}</p>
                            {unreadItem ? <span className="h-2 w-2 rounded-full bg-rose-400" /> : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-slate-300">{getMessage(item)}</p>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">{formatDate(item.createdAt || item.timestamp)}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="m-2 rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-slate-400 shadow-inner">
                    <Bell size={26} />
                  </div>
                  <p className="mt-4 text-sm font-black text-white">Chua co thong bao nao</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Khi Admin phan hoi danh gia, tin se hien tai day.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
