import { ShieldAlert } from 'lucide-react';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { ViolationTypesManager } from '@/components/manager/ViolationTypesManager';

export function ManagerPenaltyPricingPage() {
  const { buildingId } = useBuildingContext();

  return (
    <div className="space-y-6 max-w-2xl mx-auto md:mx-0">
      <div
        className="relative overflow-hidden rounded-3xl border border-rose-100/80 p-6 shadow-md transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(255,228,230,0.6) 0%, rgba(255,255,255,0.8) 50%, rgba(254,226,226,0.4) 100%)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(225,29,72,0.08),transparent_70%)] pointer-events-none blur-2xl" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
            Building Policies
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert size={20} className="text-rose-600 stroke-[2.5]" />
            Penalty Pricing
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Configure the violation penalty price list. Staff apply these configured fines as read-only.
          </p>
        </div>
      </div>

      <ViolationTypesManager buildingId={buildingId} />
    </div>
  );
}
