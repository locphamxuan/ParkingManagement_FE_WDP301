import { Quote, User } from 'lucide-react';
import type { PublicReview } from '@/services/user/userApi';
import { StarRating } from '@/components/reviews/StarRating';
import { fmtTime } from '@/hooks/useReviews';

interface ReviewCardProps {
  item: PublicReview;
}

/**
 * Single review card — read-only. Reviews are published anonymously (the public
 * feed carries no reviewer name, avatar or replier identity by design, see
 * PublicReview / publicFeedback.dto.js), and the feed only ever contains
 * `resolved` feedback, which the backend refuses to delete. So there is
 * deliberately no delete control here.
 */
export function ReviewCard({ item }: ReviewCardProps) {
  return (
    <div className="group relative rounded-3xl border border-white/6 bg-white/3 p-6 hover:border-orange-500/20 hover:bg-white/5 transition-all duration-350 shadow-lg hover:shadow-orange-500/2 shadow-slate-950/20 hover:scale-[1.01]">
      {/* Background decoration inside card */}
      <div className="absolute top-0 right-0 p-4 text-white/5 group-hover:text-orange-500/5 transition-colors">
        <Quote size={40} className="transform rotate-180" />
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-md shadow-orange-500/10">
          <User size={18} />
        </div>

        <div className="space-y-1">
          <p className="font-bold text-white leading-tight">Verified customer</p>
          <p className="text-[10px] font-semibold text-slate-450 tracking-wide">
            {item.building?.name || 'Parking lot'}
          </p>
        </div>
      </div>

      {/* Rating stars & Date */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-0.5 text-orange-400">
          <StarRating rating={item.rating} size={14} />
          <span className="ml-1.5 text-xs font-black text-slate-350">{item.rating}.0</span>
        </div>
        <span className="text-[10px] text-slate-500 font-semibold">{fmtTime(item.createdAt)}</span>
      </div>

      {/* Comment text */}
      <p className="mt-3 text-sm text-slate-300 leading-relaxed font-medium">
        {item.comment}
      </p>

      {/* Manager's reply */}
      {item.staffReply && (
        <div className="mt-4 rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            <p className="text-[10px] font-black uppercase tracking-wider text-orange-400">
              Reply from the parking operator
            </p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {item.staffReply}
          </p>
        </div>
      )}
    </div>
  );
}
