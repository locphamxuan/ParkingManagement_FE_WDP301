import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CarFront, CheckCircle2, Loader2, MessageSquareText, Star, X } from 'lucide-react';
import { useSubmitFeedback } from '@/hooks/useFeedbackNotifications';
import type { PendingFeedbackTarget } from '@/services/feedbackNotificationService';

const REASONS = ['Service attitude', 'Facilities', 'Security', 'Cleanliness', 'Other'];

interface FeedbackModalProps {
  open: boolean;
  targets: PendingFeedbackTarget[];
  onClose: () => void;
  onSubmitted: () => void;
}

function getTargetId(target?: PendingFeedbackTarget | null) {
  if (!target) return '';
  return target.parkingSessionId || target.reservationId || target.item?._id || target.item?.id || target._id || target.id || '';
}

function getBuildingName(target?: PendingFeedbackTarget | null) {
  const building = target?.item?.building;
  if (!building) return 'PBMS Parking';
  if (typeof building === 'string') return building;
  return building.name || building.code || 'PBMS Parking';
}

function formatTime(value?: string) {
  if (!value) return 'Just completed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just completed';
  return date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function FeedbackModal({ open, targets, onClose, onSubmitted }: FeedbackModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { submit, submitting, error } = useSubmitFeedback();

  const selectedTarget = targets[selectedIndex] ?? targets[0] ?? null;
  const targetId = getTargetId(selectedTarget);

  useEffect(() => {
    if (!open) return;
    setSelectedIndex(0);
    setRating(0);
    setHoverRating(0);
    setCategories([]);
    setComment('');
    setSuccess(false);
    setLocalError(null);
  }, [open]);

  const titleLine = useMemo(() => {
    const item = selectedTarget?.item;
    const code = item?.code ? `#${item.code}` : item?.plateNumber || targetId.slice(-6).toUpperCase();
    return `${getBuildingName(selectedTarget)} - ${code || 'parking session'}`;
  }, [selectedTarget, targetId]);

  const toggleReason = (reason: string) => {
    setCategories((current) => current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason]);
  };

  const handleSubmit = async () => {
    setLocalError(null);
    if (!selectedTarget || !targetId) {
      setLocalError('Could not find the parking session to review.');
      return;
    }
    if (!rating) {
      setLocalError('Please select a star rating.');
      return;
    }
    if (comment.length > 150) {
      setLocalError('Comment must not exceed 150 characters.');
      return;
    }

    await submit({
      parkingSessionId: selectedTarget.type === 'parkingSession' || selectedTarget.parkingSessionId ? targetId : undefined,
      reservationId: selectedTarget.type === 'reservation' || selectedTarget.reservationId ? targetId : undefined,
      rating,
      categories,
      comment,
    });
    setSuccess(true);
    window.setTimeout(() => {
      onSubmitted();
      onClose();
    }, 700);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_34%)]" />
            <div className="relative p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">
                    <MessageSquareText size={13} /> Feedback
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-white">Rate your parking experience</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-400">{titleLine}</p>
                </div>
                <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              {targets.length > 1 ? (
                <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                  {targets.map((target, index) => (
                    <button
                      key={`${getTargetId(target)}-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={`min-w-[190px] rounded-2xl border px-3 py-2 text-left transition ${index === selectedIndex ? 'border-orange-400/50 bg-orange-500/10 text-white' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20'}`}
                    >
                      <div className="flex items-center gap-2 text-xs font-black">
                        <CarFront size={14} /> {target.item?.plateNumber || target.item?.code || 'Parking session'}
                      </div>
                      <div className="mt-1 text-[11px] font-semibold opacity-80">{formatTime(target.item?.exitTime || target.item?.endTime || target.item?.updatedAt)}</div>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Satisfaction rating</p>
                <div className="mt-3 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="rounded-2xl p-1 transition hover:scale-110"
                        aria-label={`${star} stars`}
                      >
                        <Star size={34} className={active ? 'fill-amber-400 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]' : 'text-slate-700'} />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-sm font-bold text-slate-300">{rating ? `${rating}/5 stars` : 'Select a rating'}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {REASONS.map((reason) => (
                  <label key={reason} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition ${categories.includes(reason) ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-100' : 'border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20'}`}>
                    <input type="checkbox" checked={categories.includes(reason)} onChange={() => toggleReason(reason)} className="h-4 w-4 accent-cyan-400" />
                    {reason}
                  </label>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Optional comment</label>
                  <span className={`text-xs font-black ${comment.length > 150 ? 'text-rose-400' : 'text-slate-500'}`}>{comment.length}/150</span>
                </div>
                <textarea
                  value={comment}
                  maxLength={150}
                  onChange={(event) => setComment(event.target.value.slice(0, 150))}
                  placeholder="Share a brief experience..."
                  className="min-h-[110px] w-full resize-none rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400/50 focus:ring-4 focus:ring-orange-500/10"
                />
              </div>

              {(localError || error) ? (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200">
                  <AlertCircle size={16} /> {localError || error}
                </div>
              ) : null}
              {success ? (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200">
                  <CheckCircle2 size={16} /> Thank you for your feedback.
                </div>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black text-slate-300 transition hover:bg-white/5">Later</button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || success}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(249,115,22,0.25)] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Submit review
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
