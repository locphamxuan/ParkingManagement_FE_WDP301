import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Star, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { userApi } from '@/services/user/userApi';
import type { Feedback } from '@/services/user/userApi';
import { Modal } from '@/components/ui/modal';

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
    setLoading(true);
    try {
      const query: Record<string, string | undefined> = {
        buildingId,
      };
      if (statusFilter !== 'all') {
        query.status = statusFilter;
      }
      const result = await userApi.feedbacks.listAll(query);
      setReviews(result.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
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
    if (!replyForm.staffReply.trim()) {
      alert('Please enter a response');
      return;
    }

    setReplying(true);
    try {
      // Create a new FormData to send the reply
      // Since userApi doesn't have a reply endpoint, we'll need to implement this via direct API call
      const response = await fetch(
        `/api/feedbacks/${replyForm.reviewId}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffReply: replyForm.staffReply.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit response');
      }

      await refresh();
      setReplyModalOpen(false);
      setReplyForm({ reviewId: '', staffReply: '' });
      setSelectedReview(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setReplying(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (review.user?.fullName ?? '').toLowerCase().includes(searchLower) ||
      (review.user?.email ?? '').toLowerCase().includes(searchLower) ||
      (review.parkingSession?.plateNumber ?? '').toLowerCase().includes(searchLower) ||
      (review.comment ?? '').toLowerCase().includes(searchLower)
    );
  });

  const columns: DataColumn<Feedback>[] = [
    {
      key: 'user',
      title: 'Users',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.user?.fullName ?? '—'}</p>
          <p className="text-xs text-slate-500">{item.user?.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'plateNumber',
      title: 'Plate number',
      render: (item) => (
        <span className="inline-block rounded-lg bg-sky-50/50 border border-sky-150 px-2.5 py-1 font-mono text-xs font-black text-sky-700">
          {item.parkingSession?.plateNumber ?? '—'}
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
              size={14}
              className={i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}
            />
          ))}
          <span className="ml-2 text-xs font-semibold text-slate-550">{item.rating}/5</span>
        </div>
      ),
    },
    {
      key: 'comment',
      title: 'Comment',
      render: (item) => (
        <p className="line-clamp-2 text-sm text-slate-650 font-medium">{item.comment}</p>
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
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              resolved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-755 border-amber-200'
            }`}
          >
            <Icon size={12} />
            {resolved ? 'Replied' : 'Awaiting reply'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      title: 'Date',
      render: (item) => (
        <span className="text-xs text-slate-500 font-medium">
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
          className="text-xs hover:bg-primary/10 hover:text-primary"
        >
          <MessageSquare size={14} className="mr-1" />
          {item.status === 'resolved' ? 'Edit' : 'Reply'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and reply to user reviews</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{filteredReviews.length}</div>
          <p className="text-xs text-muted-foreground">total reviews</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-sky-100 bg-white p-4 md:flex-row md:items-center md:justify-between shadow-sm">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, plate or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="text-xs"
          >All</Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
            className="text-xs"
          >Awaiting reply</Button>
          <Button
            variant={statusFilter === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('resolved')}
            className="text-xs"
          >Replied</Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="rounded-xl border border-sky-100 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare size={32} className="mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-muted-foreground">No reviews</p>
          </div>
        ) : (
          <DataTable title="Reviews list" columns={columns} rows={filteredReviews} />
        )}
      </div>

      {/* Reply Modal */}
      <Modal isOpen={replyModalOpen} onClose={() => !replying && setReplyModalOpen(false)}>
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
          <div className="border-b border-border p-6">
            <h2 className="text-xl font-bold text-slate-800">Reply to review</h2>
            {selectedReview && (
              <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 border border-sky-100">
                <div>
                  <p className="text-xs font-semibold text-slate-400">USER</p>
                  <p className="mt-1 font-medium text-slate-800">{selectedReview.user?.fullName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">RATING</p>
                  <div className="mt-1 flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < selectedReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}
                      />
                    ))}
                    <span className="ml-2 text-sm font-semibold text-slate-500">
                      {selectedReview.rating}/5
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">BÌNH LUẬN</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedReview.comment}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Your response *</label>
              <textarea
                value={replyForm.staffReply}
                onChange={(e) =>
                  setReplyForm({ ...replyForm, staffReply: e.target.value })
                }
                placeholder="Enter a response to this review..."
                rows={5}
                className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2 text-slate-800 placeholder-slate-400 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => !replying && setReplyModalOpen(false)}
                disabled={replying}
              >Cancel</Button>
              <Button
                onClick={handleReplySubmit}
                disabled={replying || !replyForm.staffReply.trim()}
                className="bg-primary hover:brightness-110 text-primary-foreground"
              >
                {replying ? 'Sending...' : 'Submit response'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
