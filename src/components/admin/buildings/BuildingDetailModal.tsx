import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { AdminPricePolicy, AdminBuildingPackage } from '@/services/admin/adminApi';

export interface DetailState {
  buildingName: string;
  pricePolicies: AdminPricePolicy[];
  packages: AdminBuildingPackage[];
}

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const vehicleTypeLabel = (vt: AdminPricePolicy['vehicleType'] | AdminBuildingPackage['vehicleType']) =>
  vt && typeof vt === 'object' ? vt.name : '—';

interface BuildingDetailModalProps {
  detailState: DetailState;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export function BuildingDetailModal({ detailState, isLoading, error, onClose }: BuildingDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Building details — {detailState.buildingName}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading building details...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="grid max-h-[70vh] gap-5 overflow-y-auto">
            {/* Chính sách giá */}
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Price policies ({detailState.pricePolicies.length})
              </h3>
              {detailState.pricePolicies.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">This building has no price policies yet.</p>
              ) : (
                <div className="grid gap-2">
                  {detailState.pricePolicies.map((p) => (
                    <div key={p._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {vehicleTypeLabel(p.vehicleType)} · {fmtVnd(p.hourlyRate)}/hr
                          {p.dailyCap ? ` · daily cap ${fmtVnd(p.dailyCap)}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Gói dài hạn của tòa nhà */}
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Long-term packages ({detailState.packages.length})
              </h3>
              {detailState.packages.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">This building has no long-term packages yet.</p>
              ) : (
                <div className="grid gap-2">
                  {detailState.packages.map((pkg) => (
                    <div key={pkg._id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                      <div>
                        <p className="font-medium">
                          {pkg.name}
                          {pkg.code && <span className="ml-1.5 font-mono text-xs text-muted-foreground">{pkg.code}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicleTypeLabel(pkg.vehicleType)} · {fmtVnd(pkg.price)} · {pkg.durationDays} days
                        </p>
                      </div>
                      <StatusBadge status={pkg.isActive ? 'active' : 'inactive'} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
