import { useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ModalForm } from '@/components/shared/ModalForm';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Feedback } from '@/services/manager/managerApi';

const FEEDBACK_STATUS: Feedback['status'][] = ['open', 'in_progress', 'resolved', 'closed'];

export function ManagerFeedbacksPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Feedback[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState<Feedback | null>(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<Feedback['status']>('in_progress');

  const refresh = useCallback(() => {
    setLoading(true);
    managerApi.feedbacks
      .list(buildingId, { status: statusFilter || undefined })
      .then((res) => setItems(res.data.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [buildingId, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openRespond = (row: Feedback) => {
    setResponding(row);
    setResponse(row.response ?? '');
    setStatus(row.status === 'open' ? 'in_progress' : row.status);
  };

  const onSubmit = async () => {
    if (!responding) return;
    try {
      await managerApi.feedbacks.respond(buildingId, responding._id, {
        response: response.trim() || undefined,
        status,
      });
      setResponding(null);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <select
          className="h-9 rounded-md border border-border bg-card px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          {FEEDBACK_STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Chưa có phản hồi nào.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((fb) => (
            <Card key={fb._id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{fb.subject}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fb.user?.fullName ?? 'Khách'} ·{' '}
                    {new Date(fb.createdAt).toLocaleString('vi-VN')}{' '}
                    {fb.rating ? `· ${fb.rating} ⭐` : ''}
                  </p>
                </div>
                <StatusBadge status={fb.status} />
              </CardHeader>
              <CardContent className="grid gap-2">
                <p className="text-sm text-foreground">{fb.content}</p>
                {fb.response ? (
                  <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Phản hồi từ quản lý
                    </p>
                    <p className="mt-1 text-foreground">{fb.response}</p>
                  </div>
                ) : null}
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" className="gap-1" onClick={() => openRespond(fb)}>
                    <MessageCircle size={14} /> Phản hồi
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ModalForm
        open={Boolean(responding)}
        onOpenChange={(open) => {
          if (!open) setResponding(null);
        }}
        title="Phản hồi khách hàng"
        onSubmit={onSubmit}
      >
        <div className="grid gap-3">
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
            <p className="font-semibold">{responding?.subject}</p>
            <p className="mt-1 text-muted-foreground">{responding?.content}</p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Nội dung phản hồi</label>
            <textarea
              className="min-h-[110px] rounded-md border border-border bg-card p-3 text-sm"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Cảm ơn phản hồi của bạn..."
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs uppercase text-muted-foreground">Trạng thái</label>
            <select
              className="h-10 rounded-md border border-border bg-card px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as Feedback['status'])}
            >
              {FEEDBACK_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ModalForm>
    </div>
  );
}
