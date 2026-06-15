import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Search, User, LogOut } from "lucide-react";
import AdminUserDropdown from "./AdminUserDropdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  title: string;
  email: string;
  onLogout: () => void;
  hideSearch?: boolean;
  compactProfile?: boolean;
  hideNotification?: boolean;
}

export function Navbar({
  title,
  email,
  onLogout,
  hideSearch = false,
  compactProfile = false,
  hideNotification = false,
}: NavbarProps) {
  const [notifCount, setNotifCount] = useState<number>(0);

  useEffect(() => {
    function readCount() {
      const raw = localStorage.getItem("pbms.notificationsCount");
      const n = raw ? parseInt(raw, 10) : 0;
      setNotifCount(Number.isFinite(n) ? n : 0);
    }
    readCount();
    function onStorage(e: StorageEvent) {
      if (e.key === "pbms.notificationsCount") readCount();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const [notifList, setNotifList] = useState<Array<any>>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    function readList() {
      try {
        const raw = localStorage.getItem("pbms.notifications");
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list)) setNotifList(list);
      } catch (err) {
        setNotifList([]);
      }
    }
    readList();
    function onStorage(e: StorageEvent) {
      if (
        e.key === "pbms.notifications" ||
        e.key === "pbms.notificationsCount"
      ) {
        readList();
        const raw = localStorage.getItem("pbms.notificationsCount");
        const n = raw ? parseInt(raw, 10) : 0;
        setNotifCount(Number.isFinite(n) ? n : 0);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-900/90 px-6 py-4 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
            CONTROL SYSTEM
          </p>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
            {title}
          </h1>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 relative">
          {!hideSearch && (
            <div className="relative hidden w-full max-w-md md:block">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                size={15}
              />
                <Input
                className="border-white/10 bg-slate-800/70 pl-10 text-slate-200 shadow-none placeholder:text-slate-500 rounded-full h-9.5 focus:border-orange-500/40"
                placeholder="Quick search..."
              />
            </div>
          )}

          {compactProfile ? (
            <div className="flex items-center gap-3">
              {!hideNotification && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !showNotifPanel;
                      setShowNotifPanel(next);
                      if (next) {
                        // mark read: clear count
                        localStorage.setItem("pbms.notificationsCount", "0");
                        setNotifCount(0);
                        // mark notifications as read
                        try {
                          const raw = localStorage.getItem("pbms.notifications");
                          const list = raw ? JSON.parse(raw) : [];
                          if (Array.isArray(list) && list.length) {
                            const updated = list.map((it: any) => ({
                              ...it,
                              read: true,
                            }));
                            localStorage.setItem(
                              "pbms.notifications",
                              JSON.stringify(updated),
                            );
                            setNotifList(updated);
                          }
                        } catch (err) {}
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-full bg-transparent h-9 w-9 text-slate-200 hover:bg-slate-800/60 hover:shadow-md hover:ring-1 hover:ring-orange-500/20 transition relative"
                    aria-label="Notifications"
                    title="Notifications"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/70 text-slate-300 border border-white/10">
                      <Bell size={16} />
                    </span>
                    {notifCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[11px] font-mono font-black">
                        {notifCount > 99 ? "99+" : String(notifCount)}
                      </span>
                    )}
                  </button>

                  {showNotifPanel && (
                    <div className="absolute right-0 top-full mt-2 w-80 max-h-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-xl shadow-black/40 z-50">
                      <div className="px-3 py-2 text-sm text-slate-300">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold">Notifications</div>
                          <button
                            className="text-[11px] text-slate-400 hover:text-white"
                            onClick={() => {
                              // clear all
                              localStorage.setItem(
                                "pbms.notifications",
                                JSON.stringify([]),
                              );
                              localStorage.setItem("pbms.notificationsCount", "0");
                              setNotifList([]);
                              setNotifCount(0);
                              setShowNotifPanel(false);
                            }}
                          >
                            Mark as read
                          </button>
                        </div>
                      </div>
                      <div className="divide-y divide-white/5 max-h-56 overflow-auto">
                        {notifList && notifList.length > 0 ? (
                          notifList.slice(0, 50).map((n: any) => (
                            <div
                              key={n.id ?? n.timestamp}
                              className={`px-4 py-3 text-sm ${n.read ? "bg-transparent" : "bg-slate-800/20"} hover:bg-slate-800/30 cursor-pointer`}
                            >
                              <div className="font-semibold text-slate-100 truncate">
                                {n.title ?? "Notification"}
                              </div>
                              {n.body && (
                                <div className="text-xs text-slate-300 mt-1 truncate">
                                  {n.body}
                                </div>
                              )}
                              {n.timestamp && (
                                <div className="text-[11px] text-slate-400 mt-1">
                                  {new Date(n.timestamp).toLocaleString()}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-sm text-slate-400">
                            No notifications
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="relative inline-block">
                <AdminUserDropdown
                  compact
                  onLogout={() => {
                    // fallback logout route for compact header
                    localStorage.removeItem("pbms.token");
                    localStorage.removeItem("pbms.user");
                    window.location.href = "/auth/login";
                  }}
                />
              </div>
            </div>
          ) : (
            <>
              {!hideNotification && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 rounded-full border border-white/10 bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white shadow-sm h-9.5 px-4 transition-all relative"
                >
                  <span className="relative inline-flex">
                    <Bell size={14} className="text-slate-400" />
                    {notifCount > 0 && (
                      <span className="absolute -top-2 -right-2 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[11px] font-mono font-black">
                        {notifCount > 99 ? "99+" : String(notifCount)}
                      </span>
                    )}
                  </span>
                </Button>
              )}

              {/* Custom user dropdown (desktop) */}
              <AdminUserDropdown email={email} onLogout={onLogout} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
