import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import type { ProfileWorkflow } from '@/hooks/user/useProfileWorkflow';

type ProfileAlertsProps = Pick<ProfileWorkflow, 'successMessage' | 'hasMissingInfo' | 'isEditing' | 'user'>;

// Banner thông báo thành công (sau khi lưu) + cảnh báo hồ sơ thiếu thông tin.
export function ProfileAlerts({ successMessage, hasMissingInfo, isEditing, user }: ProfileAlertsProps) {
  const missingDetails = [
    !user?.phone?.trim() ? 'a phone number' : null,
    user?.licensePlates.length === 0 ? 'at least one license plate' : null,
  ].filter(Boolean);

  return (
    <>
      {/* Success Alert Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-black uppercase tracking-wider font-mono text-emerald-700 shadow-sm"
          >
            <CheckCircle2 size={16} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Alert Box when licensePlates is empty or phone missing */}
      <AnimatePresence>
        {hasMissingInfo && !isEditing && user && (
          <motion.div
            key="warning"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="mb-6 flex items-start gap-4 rounded-2xl border border-amber-300 bg-amber-50/95 p-5 shadow-[0_12px_28px_rgba(180,83,9,0.08)]"
          >
            <div className="shrink-0 rounded-xl bg-amber-100 p-2 text-amber-700">
              <ShieldAlert size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 font-mono">Complete your profile</h4>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-amber-800">
                Please add {missingDetails.join(' and ')} in “Edit Profile” to enable automatic recognition at control gates.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
