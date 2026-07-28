import { motion } from 'framer-motion';
import { CalendarClock } from 'lucide-react';
import { PackageCard } from '@/components/user/PackageCard';
import { packageCategory, categoryColors, isCarPackage } from '@/pages/user/packageBookingHelper';
import type { VehicleKind } from '@/pages/user/packageBookingHelper';
import type { LongTermPackage } from '@/services/user/userApi';

interface PackageBookingPanelProps {
  disabled: boolean;
  packages: LongTermPackage[];
  isLoading: boolean;
  selectedPkg: LongTermPackage | null;
  onSelectPackage: (pkg: LongTermPackage) => void;
  selectedVehicleType: VehicleKind | '';
}

export function PackageBookingPanel({
  disabled,
  packages,
  isLoading,
  selectedPkg,
  onSelectPackage,
  selectedVehicleType,
}: PackageBookingPanelProps) {
  return (
    <motion.div
      key="package"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-5"
    >
      {/* Package Cards */}
      <div className="user-surface rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300/70">Select long-term package</span>
        </div>
        {disabled && (
          <p className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">Choose a vehicle type to see which packages fit your vehicle.</p>
        )}

        {packages.length === 0 ? (
          <p className="text-sm text-slate-500 font-semibold py-4 text-center">
            {isLoading ? 'Loading...' : 'No packages available for this building.'}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => {
              const cat = packageCategory(pkg);
              const colors = categoryColors[cat];
              const isSelected = selectedPkg?._id === pkg._id;
              const isCar = isCarPackage(pkg);
              // isLocked: only when a vehicle type IS selected and this package doesn't match
              const isLocked = !!selectedVehicleType && (selectedVehicleType === 'car' ? !isCar : isCar);
              return (
                <PackageCard
                  key={pkg._id}
                  pkg={pkg}
                  isSelected={isSelected}
                  isLocked={isLocked}
                  isDisabled={disabled}
                  cat={cat}
                  colors={colors}
                  onClick={() => {
                    if (disabled || isLocked) return;
                    onSelectPackage(pkg);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Package Date — always starts immediately at purchase time */}
      {selectedPkg && (
        <div className="user-surface rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock size={16} className="text-purple-300/70" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300/70">Package Start Date</span>
          </div>
          <p className="text-sm font-bold text-slate-200">Starts today, valid for {selectedPkg.durationDays} days.</p>
        </div>
      )}
    </motion.div>
  );
}
