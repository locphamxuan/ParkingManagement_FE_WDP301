import { CalendarClock, Bike, Car } from 'lucide-react';
import type { BookingMode, VehicleKind } from '@/pages/user/reservationsHelper';
import { fmtShort, fmtMoney } from '@/pages/user/reservationsHelper';

interface BookingSummarySidebarProps {
  selectedBuildingName?: string;
  mode: BookingMode;
  selectedPkgName?: string;
  selectedVehicleType: VehicleKind | '';
  selectedSlot: string | null;
  selectedPlate: string;
  startDateTime: Date | null;
  endDateTime: Date | null;
  estimatedAmount: number;
}

export function BookingSummarySidebar({
  selectedBuildingName,
  mode,
  selectedPkgName,
  selectedVehicleType,
  selectedSlot,
  selectedPlate,
  startDateTime,
  endDateTime,
  estimatedAmount,
}: BookingSummarySidebarProps) {
  return (
    <div className="lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-5">
        <div className="flex items-center gap-2 mb-5">
          <CalendarClock size={16} className="text-orange-300/70" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">
            Tóm tắt đặt chỗ
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-400">Building</span>
            <span className="font-black text-white">{selectedBuildingName || '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-400">Mode</span>
            <span className="font-black text-white">
              {mode === 'hourly' ? 'Theo giờ' : selectedPkgName || 'Long-term package'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-400">Vehicle type</span>
            <span className="font-black text-white flex items-center gap-1.5">
              {selectedVehicleType === 'motorcycle' ? (
                <>
                  <Bike size={12} className="text-purple-300" />Motorcycle</>
              ) : selectedVehicleType === 'car' ? (
                <>
                  <Car size={12} className="text-cyan-300" />Car</>
              ) : (
                '—'
              )}
            </span>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[9px] font-bold uppercase text-slate-500">Slot</p>
              <p className="mt-1 font-mono text-lg font-black text-orange-300">
                {selectedSlot || '—'}
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-[9px] font-bold uppercase text-slate-500">Plate number</p>
              <p className="mt-1 font-mono text-sm font-black text-cyan-200 truncate">
                {selectedPlate || '—'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[9px] font-bold uppercase text-slate-500">Nhận bãi</p>
            <p className="mt-1 text-sm font-black text-white">
              {startDateTime ? fmtShort(startDateTime) : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[9px] font-bold uppercase text-slate-500">Trả bãi</p>
            <p className="mt-1 text-sm font-black text-white">
              {endDateTime ? fmtShort(endDateTime) : '—'}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
            <span className="text-xs font-bold text-emerald-200">Số tiền</span>
            <span className="font-mono text-sm font-black text-emerald-300">
              {estimatedAmount ? fmtMoney(estimatedAmount) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
