import { useMemo } from 'react';
import { Building2, Clock, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';

const STATUS_LABEL: Record<string, { label: string; dot: string }> = {
  active: { label: 'Active', dot: 'bg-emerald-500' },
  maintenance: { label: 'Maintenance', dot: 'bg-amber-500' },
  inactive: { label: 'Inactive', dot: 'bg-rose-500' },
};

const statusInfo = (status?: string) => STATUS_LABEL[status ?? 'inactive'] ?? STATUS_LABEL.inactive;

export function ManagerBuildingsPage() {
  const { buildings, selectedBuilding, selectedBuildingId, setSelectedBuildingId, isLoading, error } =
    useManagerBuildings();

  const buildingOptions = useMemo(
    () => buildings.map((b) => ({ id: b._id, label: b.name || b.code || 'Building' })),
    [buildings],
  );

  return (
    <div className="space-y-6">
      {/* Building list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 size={16} className="text-primary" />
            Assigned Buildings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading buildings…</p>
          ) : error ? (
            <p className="text-sm text-rose-500">{error}</p>
          ) : buildings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No buildings assigned to this account.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {buildingOptions.map((opt) => {
                const b = buildings.find((x) => x._id === opt.id)!;
                const st = statusInfo(b.status);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedBuildingId(opt.id)}
                    className={`rounded-2xl border p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 ${
                      selectedBuildingId === opt.id ? 'border-primary bg-primary/8 shadow-sm' : 'border-border'
                    }`}
                  >
                    <p className="font-semibold text-foreground">{opt.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Code: {b.code || '—'}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      <p className="text-xs text-muted-foreground">{st.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Building details (read-only) */}
      {selectedBuilding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Building Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Name" value={selectedBuilding.name || '—'} />
            <DetailRow label="Code" value={selectedBuilding.code || '—'} />
            <DetailRow
              icon={<Layers size={13} className="text-muted-foreground" />}
              label="Total floors"
              value={String(selectedBuilding.totalFloors ?? '—')}
            />
            <DetailRow label="Status" value={statusInfo(selectedBuilding.status).label} />
            {(() => {
              const oh = selectedBuilding.operatingHours as { open?: string; close?: string } | undefined;
              if (!oh) return null;
              return (
                <DetailRow
                  icon={<Clock size={13} className="text-muted-foreground" />}
                  label="Operating hours"
                  value={`${oh.open ?? '—'} – ${oh.close ?? '—'}`}
                />
              );
            })()}
            <p className="sm:col-span-2 text-xs text-muted-foreground">
              To change operating hours, use the “Operating Hours” tab. Other building details are
              managed by the system administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
