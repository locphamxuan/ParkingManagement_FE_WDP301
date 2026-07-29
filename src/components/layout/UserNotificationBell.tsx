import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi, type AppNotification, NOTIFICATION_TYPE_LABEL } from '@/services/notificationApi';

export function UserNotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = () => {
    notificationApi
      .list()
      .then((res) => {
        const d = (res as { data?: { items?: AppNotification[]; unread?: number } })?.data;
        setItems(d?.items ?? []);
        setUnread(d?.unread ?? 0);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
  }, []);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((p) => p.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (_err) {
      /* ignore */
    }
  };

  const markOne = async (n: AppNotification) => {
    if (n.isRead) return;
    try {
      await notificationApi.markRead(n._id);
      setItems((p) => p.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    } catch (_err) {
      /* ignore */
    }
  };


  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          load();
        }}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
        aria-label="Notifications"
      >
        <Bell size={14} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wider text-cyan-700">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="flex items-center gap-1 text-[11px] font-semibold text-cyan-700 hover:text-cyan-900"
              >
                <CheckCheck size={12} />Mark all read</button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-500">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => markOne(n)}
                  className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-blue-50 ${
                    n.isRead ? '' : 'bg-rose-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />}
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        {NOTIFICATION_TYPE_LABEL[n.type] ?? 'Notifications'}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-500">
                      {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{n.message}</p>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
            className="block w-full border-t border-slate-100 px-4 py-2.5 text-center text-[11px] font-semibold text-cyan-700 hover:bg-blue-50 hover:text-cyan-900"
          >View all notifications →</button>
        </div>
      )}
    </div>
  );
}
