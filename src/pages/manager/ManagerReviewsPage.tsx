import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Star, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi } from '@/services/manager/managerApi';
import type { Feedback } from '@/services/user/userApi';
import { Modal } from '@/components/ui/modal';
import { showToast } from '@/components/common/ToastNotification';

interface ReplyFormState {
  reviewId: string;
  staffReply: string;
}

export function ManagerReviewsPage() {
  const { buildingId } = useBuildingContext();
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Feedback | null>(null);
  const [replyForm, setReplyForm] = useState<ReplyFormState>({ reviewId: '', staffReply: '' });
  const [replying, setReplying] = useState(false);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    try {
      const query: Record<string, string | undefined> = {};
      if (statusFilter !== 'all') {
        query.status = statusFilter;
      }
      const result = await managerApi.feedbacks.list(buildingId, query);
      setReviews(result.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [buildingId, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleReplyClick = (review: Feedback) => {
    setSelectedReview(review);
    setReplyForm({ reviewId: review._id, staffReply: review.staffReply || '' });
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async () => {
    if (!buildingId) {
      showToast('Building information not found', 'error');
      return;
    }
    if (!replyForm.staffReply.trim()) {
      showToast('Please enter a reply', 'error');
      return;
    }

    setReplying(true);
    try {
      await managerApi.feedbacks.respond(buildingId, replyForm.reviewId, {
        staffReply: replyForm.staffReply.trim(),
        status: 'resolved',
      });

      await refresh();
      setReplyModalOpen(false);
      setReplyForm({ reviewId: '', staffReply: '' });
      setSelectedReview(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send reply', 'error');
    } finally {
      setReplying(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (review.user?.fullName || '').toLowerCase().includes(searchLower) ||
      (review.user?.email || '').toLowerCase().includes(searchLower) ||
      (review.parkingSession?.plateNumber || '').toLowerCase().includes(searchLower) ||
      (review.comment || '').toLowerCase().includes(searchLower)
    );
  });

  const columns: DataColumn<Feedback>[] = [
    {
      key: 'user',
      title: 'User',
      render: (item) => (
        <div className="text-slate-800">
          <p className="font-semibold text-slate-800">{item.user?.fullName || 'Anonymous User'}</p>
          <p className="text-xs text-slate-400 font-medium">{item.user?.email || 'N/A'}</p>
        </div>
      ),
    },
    {
      key: 'plateNumber',
      title: 'Plate',
      render: (item) => (
        <span className="inline-block rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700">
          {item.parkingSession?.plateNumber || '—'}
        </span>
      ),
    },
    {
      key: 'rating',
      title: 'Rating',
      render: (item) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={13}
              className={i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
            />
          ))}
          <span className="ml-1.5 text-xs font-bold text-slate-500 font-mono">{item.rating}/5</span>
        </div>
      ),
    },
    {
      key: 'comment',
      title: 'Comment',
      render: (item) => (
        <p className="line-clamp-2 text-xs font-semibold text-slate-600 max-w-xs" title={item.comment}>
          {item.comment || '—'}
        </p>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (item) => {
        const resolved = item.status === 'resolved';
        const Icon = resolved ? CheckCircle : Clock;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider select-none border ${
              resolved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <Icon size={10} className="stroke-[2.5]" />
            {resolved ? 'Replied' : 'Pending'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      title: 'Date',
      render: (item) => (
        <span className="text-xs font-bold text-slate-550 font-mono">
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (item) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleReplyClick(item)}
          className="text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-700 hover:bg-blue-50/50"
        >
          <MessageSquare size={13} className="mr-1.5" />
          {item.status === 'resolved' ? 'Edit' : 'Reply'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
              Audience Feedback
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
              Customer Reviews
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Manage, audit, and reply to user feedback, star ratings, and parking experiences.
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-3xl font-mono font-black text-blue-600">{filteredReviews.length}</span>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">total reviews</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 md:flex-row md:items-center md:justify-between shadow-sm">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by name, email, plate or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md h-11 rounded-xl bg-white border-blue-100 text-slate-800 focus:border-blue-500/40"
          />
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'resolved', label: 'Replied' },
          ].map((btn) => {
            const isActive = statusFilter === btn.value;
            return (
              <Button
                key={btn.value}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(btn.value as typeof statusFilter)}
                className={`text-xs font-black uppercase tracking-wider rounded-xl h-10 px-5 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {btn.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{error}</p>
      )}

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-650 text-xs font-bold p-8 justify-center bg-white rounded-2xl">
            <Loader2 className="animate-spin mr-2" size={16} />
            <span>Loading reviews and feedback...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 text-center text-slate-800">
            <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-slate-500 font-semibold text-xs">No reviews found matching this filter.</p>
          </div>
        ) : (
          <DataTable title="Reviews" columns={columns} rows={filteredReviews} />
        )}
      </div>

      {/* Reply Modal */}
      <Modal title="Reply to Review" open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <div className="max-h-[75vh] overflow-y-auto pr-1.5 custom-scrollbar text-slate-800">
          {selectedReview && (
            <div className="mb-4 space-y-3 rounded-2xl bg-slate-50/50 border border-slate-100 p-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">User</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{selectedReview.user?.fullName || 'Anonymous User'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Rating</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < selectedReview.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                    />
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-500 font-mono">
                    {selectedReview.rating}/5
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Comment</p>
                <p className="mt-1 text-xs font-medium text-slate-600 leading-relaxed italic">"{selectedReview.comment}"</p>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono mb-2">
                Your Reply *
              </label>
              <textarea
                value={replyForm.staffReply}
                onChange={(e) =>
                  setReplyForm({ ...replyForm, staffReply: e.target.value })
                }
                placeholder="Enter a reply to this review..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500/40"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setReplyModalOpen(false)}
                disabled={replying}
                className="h-10 px-5 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReplySubmit}
                disabled={replying || !replyForm.staffReply.trim()}
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-[0.98]"
              >
                {replying ? 'Sending...' : 'Send reply'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
