import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Camera, ChevronLeft, ChevronRight, ImageIcon, Loader2, MessageSquareText, RefreshCw, Search, SendHorizonal, Star, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';
import { managerApi, type Feedback } from '@/services/manager/managerApi';

type FeedbackStatus = Feedback['status'];

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMoney(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return `${value.toLocaleString('vi-VN')} VND`;
}

function getPlate(feedback: Feedback) {
  return feedback.parkingSession?.plateNumber || feedback.reservation?.plateNumber || '—';
}

function getEntryTime(feedback: Feedback) {
  return feedback.parkingSession?.entryTime || feedback.reservation?.startTime || null;
}

function getExitTime(feedback: Feedback) {
  return feedback.parkingSession?.exitTime || feedback.reservation?.endTime || null;
}

function getFee(feedback: Feedback) {
  return feedback.parkingSession?.fee ?? feedback.reservation?.estimatedFee ?? feedback.reservation?.fee ?? null;
}

function getBuildingName(feedback: Feedback) {
  return feedback.building?.name || feedback.building?.code || '—';
}

function getCustomerName(feedback: Feedback) {
  return feedback.user?.fullName || feedback.user?.email || 'Khách hàng';
}

function statusMeta(status?: FeedbackStatus) {
  if (status === 'resolved') {
    return {
      label: 'Đã phản hồi',
      className: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-300',
    };
  }

  return {
    label: 'Chưa xử lý',
    className: 'border-amber-400/25 bg-amber-500/10 text-amber-300',
  };
}

function RatingStars({ rating }: { rating?: number | null }) {
  const safeRating = Number.isInteger(rating) ? Math.min(Math.max(Number(rating), 0), 5) : 0;

  return (
    <div className="flex items-center gap-0.5" aria-label={`${safeRating} sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          className={star <= safeRating ? 'fill-amber-400 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.25)]' : 'text-slate-700'}
        />
      ))}
      <span className="ml-1 text-xs font-black text-amber-300">{safeRating}/5</span>
    </div>
  );
}

function StatusBadge({ status }: { status?: FeedbackStatus }) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function ThumbnailButton({ src, label, onOpen }: { src?: string | null; label: string; onOpen: (src: string, label: string) => void }) {
  if (!src) {
    return (
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-slate-900/50 text-slate-600" title={`Không có ${label}`}>
        <ImageIcon size={16} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(src, label)}
      className="group relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400/50"
      title={label}
    >
      <img src={src} alt={label} className="h-full w-full object-cover" loading="lazy" />
      <span className="absolute inset-0 grid place-items-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/45 group-hover:opacity-100">
        <Search size={15} />
      </span>
    </button>
  );
}

export function ManagerFeedbackDashboard() {
  const { session } = useAuth();
  const {
    selectedBuildingId,
    setSelectedBuildingId,
    buildings,
    isLoading: buildingsLoading,
    error: buildingsError,
  } = useManagerBuildings();

  const [items, setItems] = useState<Feedback[]>([]);
  const [pagination, setPagination] = useState<PaginationState>(DEFAULT_PAGINATION);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackStatus>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);
  const [replyTarget, setReplyTarget] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySaving, setReplySaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const query = useMemo(() => {
    const next: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (statusFilter !== 'all') next.status = statusFilter;
    return next;
  }, [page, limit, statusFilter]);

  const loadFeedbacks = useCallback(async () => {
    if (!selectedBuildingId || !session?.token) {
      setItems([]);
      setPagination(DEFAULT_PAGINATION);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await managerApi.feedbacks.list(selectedBuildingId, query);
      const data = res.data;
      setItems(data.items ?? []);
      const apiPagination = data.pagination as Partial<PaginationState> | undefined;
      setPagination({
        page: Number(apiPagination?.page ?? page),
        limit: Number(apiPagination?.limit ?? limit),
        total: Number(apiPagination?.total ?? data.items?.length ?? 0),
        totalPages: Math.max(1, Number(apiPagination?.totalPages ?? 1)),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách phản hồi.');
      setItems([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [selectedBuildingId, session?.token, query, page, limit]);

  useEffect(() => {
    void loadFeedbacks();
  }, [loadFeedbacks]);

  useEffect(() => {
    setPage(1);
  }, [selectedBuildingId, limit, statusFilter]);

  const stats = useMemo(() => {
    const pending = items.filter((item) => item.status !== 'resolved').length;
    const resolved = items.filter((item) => item.status === 'resolved').length;
    const average = items.length
      ? items.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / items.length
      : 0;
    return { pending, resolved, average };
  }, [items]);

  const canPrev = page > 1 && !loading;
  const canNext = page < pagination.totalPages && !loading;

  const openReplyDrawer = (feedback: Feedback) => {
    setReplyTarget(feedback);
    setReplyText(feedback.staffReply ?? '');
    setReplyError(null);
  };

  const closeReplyDrawer = () => {
    if (replySaving) return;
    setReplyTarget(null);
    setReplyText('');
    setReplyError(null);
  };

  const submitReply = async () => {
    if (!selectedBuildingId || !replyTarget) return;
    const text = replyText.trim();
    if (!text) {
      setReplyError('Vui lòng nhập nội dung phản hồi.');
      return;
    }
    if (text.length > 1000) {
      setReplyError('Nội dung phản hồi không được vượt quá 1000 ký tự.');
      return;
    }

    setReplySaving(true);
    setReplyError(null);
    try {
      await managerApi.feedbacks.respond(selectedBuildingId, replyTarget._id, { response: text });
      setNotice({ type: 'success', message: 'Đã gửi phản hồi cho khách hàng và cập nhật trạng thái feedback.' });
      closeReplyDrawer();
      await loadFeedbacks();
      window.setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể gửi phản hồi. Vui lòng thử lại.';
      setReplyError(message);
      setNotice({ type: 'error', message });
    } finally {
      setReplySaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
              <Camera size={13} /> Feedback Center
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white md:text-3xl">Dashboard quản lý phản hồi</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-400">
              Theo dõi trải nghiệm khách hàng, hình ảnh xác thực và trạng thái phản hồi theo từng bãi xe.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pending</p>
              <p className="mt-1 text-xl font-black text-amber-300">{stats.pending}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resolved</p>
              <p className="mt-1 text-xl font-black text-emerald-300">{stats.resolved}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Avg Rating</p>
              <p className="mt-1 text-xl font-black text-orange-300">{stats.average.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-slate-900/65 p-4 shadow-xl shadow-black/10 backdrop-blur-xl">
        <div className="grid gap-3 md:grid-cols-[1.5fr_0.8fr_0.7fr_auto] md:items-end">
          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Bãi xe</label>
            <select
              value={selectedBuildingId ?? ''}
              onChange={(event) => setSelectedBuildingId(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none transition focus:border-orange-400/50 focus:ring-4 focus:ring-orange-500/10"
              disabled={buildingsLoading}
            >
              {buildings.map((building) => (
                <option key={building._id} value={building._id}>
                  {building.name || building.code || 'Unnamed building'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | FeedbackStatus)}
              className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none transition focus:border-orange-400/50 focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chưa xử lý</option>
              <option value="resolved">Đã phản hồi</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Số dòng</label>
            <select
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="mt-2 h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white outline-none transition focus:border-orange-400/50 focus:ring-4 focus:ring-orange-500/10"
            >
              {[10, 20, 50].map((value) => (
                <option key={value} value={value}>{value} / trang</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadFeedbacks()}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 text-sm font-black text-orange-300 transition hover:bg-orange-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Làm mới
          </button>
        </div>

        {buildingsError ? <p className="mt-3 text-sm font-semibold text-rose-300">{buildingsError}</p> : null}
        {error ? <p className="mt-3 text-sm font-semibold text-rose-300">{error}</p> : null}
      </section>

      <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-left">
            <thead className="border-b border-white/10 bg-slate-950/50">
              <tr className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                <th className="px-4 py-4">Khách hàng</th>
                <th className="px-4 py-4">Bãi xe</th>
                <th className="px-4 py-4">Phiên gửi xe</th>
                <th className="px-4 py-4">Đánh giá</th>
                <th className="px-4 py-4">Nội dung</th>
                <th className="px-4 py-4">Hình ảnh</th>
                <th className="px-4 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <div className="inline-flex items-center gap-3 text-sm font-bold text-slate-400">
                      <Loader2 size={18} className="animate-spin text-orange-300" /> Đang tải phản hồi...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <div className="mx-auto max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-8">
                      <ImageIcon className="mx-auto text-slate-600" size={34} />
                      <p className="mt-3 text-sm font-black text-white">Chưa có phản hồi</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Không tìm thấy feedback theo bộ lọc hiện tại.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((feedback) => (
                  <tr key={feedback._id} className="align-top transition hover:bg-white/[0.03]">
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-white">{getCustomerName(feedback)}</p>
                        <p className="text-xs font-semibold text-slate-400">{feedback.user?.email || '—'}</p>
                        <p className="text-xs font-semibold text-slate-500">{feedback.user?.phone || 'Không có SĐT'}</p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p className="max-w-[160px] text-sm font-bold text-slate-200">{getBuildingName(feedback)}</p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="space-y-2 text-xs font-semibold text-slate-400">
                        <p className="font-mono text-sm font-black text-orange-300">{getPlate(feedback)}</p>
                        <p>Vào: <span className="text-slate-300">{formatDateTime(getEntryTime(feedback))}</span></p>
                        <p>Ra: <span className="text-slate-300">{formatDateTime(getExitTime(feedback))}</span></p>
                        <p>Phí: <span className="text-emerald-300">{formatMoney(getFee(feedback))}</span></p>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <RatingStars rating={feedback.rating} />
                    </td>

                    <td className="px-4 py-4">
                      <p className="max-w-[260px] whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-300">
                        {feedback.comment || 'Không có nội dung'}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <ThumbnailButton src={feedback.portraitImageUrl} label="Ảnh chân dung" onOpen={(src, label) => setLightbox({ src, label })} />
                        <ThumbnailButton src={feedback.plateImageUrl} label="Ảnh biển số" onOpen={(src, label) => setLightbox({ src, label })} />
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={feedback.status} />
                      {feedback.staffReply ? (
                        <p className="mt-2 max-w-[180px] text-xs font-semibold leading-relaxed text-slate-400">
                          {feedback.staffReply}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4 text-right">
                      {feedback.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => openReplyDrawer(feedback)}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-orange-400/25 bg-orange-500/10 px-3 text-xs font-black text-orange-300 transition hover:-translate-y-0.5 hover:bg-orange-500/15"
                        >
                          <MessageSquareText size={14} /> Xử lý
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openReplyDrawer(feedback)}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-black text-slate-300 transition hover:bg-white/[0.06]"
                        >
                          Xem phản hồi
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-slate-950/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold text-slate-500">
            Hiển thị trang <span className="text-slate-300">{pagination.page}</span> / <span className="text-slate-300">{pagination.totalPages}</span> • Tổng <span className="text-slate-300">{pagination.total}</span> phản hồi
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-black text-slate-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} /> Trước
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPage((value) => value + 1)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-black text-slate-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {notice ? (
        <div className="fixed right-5 top-5 z-[120]">
          <div className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${notice.type === 'success' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/20 bg-rose-500/10 text-rose-200'}`}>
            <p className="text-sm font-bold">{notice.message}</p>
          </div>
        </div>
      ) : null}

      {replyTarget ? (
        <div className="fixed inset-0 z-[110]">
          <button type="button" className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" onClick={closeReplyDrawer} aria-label="Đóng phản hồi" />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col border-l border-white/10 bg-slate-900/95 shadow-2xl shadow-black/40 backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">
                  <MessageSquareText size={14} /> Manager Reply
                </div>
                <h2 className="mt-3 text-2xl font-black text-white">Phản hồi feedback khách hàng</h2>
                <p className="mt-1 text-sm font-semibold text-slate-400">Nội dung phản hồi sẽ được gửi tới người dùng qua chuông thông báo.</p>
              </div>
              <button type="button" onClick={closeReplyDrawer} disabled={replySaving} className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Tóm tắt feedback</p>
                      <h3 className="mt-2 text-lg font-black text-white">{getCustomerName(replyTarget)}</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{replyTarget.user?.email || 'Không có email'}</p>
                    </div>
                    <StatusBadge status={replyTarget.status} />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bãi xe</p>
                      <p className="mt-1 text-sm font-bold text-slate-200">{getBuildingName(replyTarget)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Biển số</p>
                      <p className="mt-1 font-mono text-sm font-black text-orange-300">{getPlate(replyTarget)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Giờ vào</p>
                      <p className="mt-1 text-sm font-bold text-slate-200">{formatDateTime(getEntryTime(replyTarget))}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chi phí</p>
                      <p className="mt-1 text-sm font-bold text-emerald-300">{formatMoney(getFee(replyTarget))}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Đánh giá khách hàng</p>
                      <RatingStars rating={replyTarget.rating} />
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-300">{replyTarget.comment || 'Khách hàng không để lại nội dung chi tiết.'}</p>
                  </div>
                </section>

                <section className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label htmlFor="manager-reply" className="text-xs font-black uppercase tracking-widest text-slate-500">Nội dung phản hồi</label>
                    <span className={`text-xs font-black ${replyText.length > 1000 ? 'text-rose-300' : 'text-slate-500'}`}>{replyText.length}/1000</span>
                  </div>

                  <textarea
                    id="manager-reply"
                    value={replyText}
                    onChange={(event) => {
                      setReplyText(event.target.value.slice(0, 1000));
                      if (replyError) setReplyError(null);
                    }}
                    placeholder="Nhập nội dung phản hồi rõ ràng, lịch sự và hữu ích cho khách hàng..."
                    className="min-h-[220px] w-full rounded-[1.5rem] border border-white/10 bg-slate-950/80 px-4 py-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400/40 focus:ring-4 focus:ring-orange-500/10"
                  />

                  {replyError ? (
                    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-rose-200">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <p className="text-sm font-bold leading-relaxed">{replyError}</p>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={closeReplyDrawer} disabled={replySaving} className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm font-black text-slate-300 transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-50">Hủy</button>
                    <button type="button" onClick={() => void submitReply()} disabled={replySaving || !replyText.trim() || replyText.length > 1000} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 text-sm font-black text-slate-950 shadow-[0_0_24px_rgba(249,115,22,0.22)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                      {replySaving ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
                      {replySaving ? 'Đang gửi...' : 'Gửi phản hồi'}
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {lightbox ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xl" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setLightbox(null)} aria-label="Đóng ảnh" />
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-black text-white">{lightbox.label}</p>
              <button type="button" onClick={() => setLightbox(null)} className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[78vh] overflow-auto bg-slate-950/60 p-3">
              <img src={lightbox.src} alt={lightbox.label} className="mx-auto max-h-[74vh] rounded-2xl object-contain" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ManagerFeedbackDashboard;

export const ManagerFeedbackPage = ManagerFeedbackDashboard;

