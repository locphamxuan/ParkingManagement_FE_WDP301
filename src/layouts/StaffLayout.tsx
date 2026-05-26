import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/shared/Navbar";
import { StaffSidebar } from "@/components/shared/StaffSidebar";
import { useAuth } from "@/hooks/useAuth";
import {
  staffApi,
  extractBuildings,
  type StaffBuilding,
} from "@/services/staff/staffApi";

const pageTitle: Record<string, string> = {
  "": "Overview",
  operations: "Operations center",
  "my-shifts": "My shifts",
  sessions: "Parking sessions",
  incidents: "Incident management",
  handover: "Shift handover",
};

export function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [buildings, setBuildings] = useState<StaffBuilding[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    user?.assignedBuildingIds?.[0] ?? null,
  );
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/auth/login", { replace: true });
  }, [logout, navigate]);

  const loadBuildings = useCallback(() => {
    setBootstrapping(true);
    setLoadError(null);

    staffApi
      .buildings()
      .then((res) => {
        const list = extractBuildings(
          res.data as StaffBuilding[] | { items: StaffBuilding[] },
        );
        setBuildings(list);
        setSelectedBuildingId(
          list[0]?._id ?? user?.assignedBuildingIds?.[0] ?? null,
        );
      })
      .catch((error) => {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load the building list.",
        );
        if (!selectedBuildingId && user?.assignedBuildingIds?.[0]) {
          setSelectedBuildingId(user.assignedBuildingIds[0]);
        }
      })
      .finally(() => setBootstrapping(false));
  }, [selectedBuildingId, user?.assignedBuildingIds, logout]);

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  const slug = useMemo(() => {
    const tail = location.pathname.replace(/^\/staff\/?/, "");
    if (!tail) return "";
    return tail.split("/")[0];
  }, [location.pathname]);

  const title = pageTitle[slug] ?? "Nhân viên";
  const selectedBuilding = buildings.find((b) => b._id === selectedBuildingId);
  const activeBuilding = selectedBuilding ?? null;
  return (
    <div className="admin-theme relative min-h-screen bg-slate-950 text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.06),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.04),transparent_60%)] blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        <StaffSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar
            title={title}
            email={user?.email ?? "staff@pbms.local"}
            onLogout={handleLogout}
            hideSearch={true}
            compactProfile={true}
          />
          <main className="flex-1 p-4 md:p-6">
            {bootstrapping ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                Loading operations area...
              </div>
            ) : loadError && !activeBuilding ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-6 text-sm text-amber-100">
                <p className="font-semibold text-white">
                  Unable to load staff building
                </p>
                <p className="mt-2 leading-6 text-amber-50/90">{loadError}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={loadBuildings}
                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:brightness-110"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : !activeBuilding ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                This account is not assigned to any building. Please contact an
                administrator.
              </div>
            ) : (
              <>
                {loadError ? (
                  <div className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-50">
                    <p className="font-semibold text-white">
                      Unable to load the building list
                    </p>
                    <p className="mt-1 leading-6">{loadError}</p>
                  </div>
                ) : null}
                <Outlet
                  context={{
                    buildingId: activeBuilding._id,
                    building: activeBuilding,
                  }}
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
