import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Clock, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type ReservationPolicy } from '@/services/manager/managerApi';

interface FormState {
  maxHoldMinutes: string;
  bookingFee: string;
  refundPercent: string;
  isActive: boolean;
}

const toForm = (p: ReservationPolicy | null): FormState => ({
  maxHoldMinutes: String(p?.maxHoldMinutes ?? 30),
  bookingFee: String(p?.bookingFee ?? 0),
  refundPercent: String(p?.refundPercent ?? 80),
  isActive: p?.isActive ?? true,
});

export function ManagerReservationPolicyPage() {
  const { buildingId } = useBuildingContext();
  const [policy, setPolicy] = useState<ReservationPolicy | null>(null);
  const [form, setForm] = useState<FormState>(toForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    setMessage(null);
    managerApi.reservationPolicy
      .get(buildingId)
      .then((res) => {
        setPolicy(res.data.item);
        setForm(toForm(res.data.item));
      })
      .catch((err) =>
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load policy' }),
      )
      .finally(() => setLoading(false));
  }, [buildingId]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await managerApi.reservationPolicy.update(buildingId, {
        maxHoldMinutes: Number(form.maxHoldMinutes),
        bookingFee: Number(form.bookingFee),
        refundPercent: Number(form.refundPercent),
        isActive: form.isActive,
      });
      setPolicy(res.data.item);
      setForm(toForm(res.data.item));
      setMessage({ type: 'success', text: 'Reservation policy saved successfully.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Save failed',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw size={14} className="animate-spin" />
        Loading policy...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock size={18} className="text-orange-400" />
          Reservation Policy
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Customers enter start and end times freely — fees are calculated automatically based on regular and peak pricing.
        </p>
      </CardHeader>
      <CardContent>
        {/* Summary card — hiện giá trị đang áp dụng */}
        {policy && (
          <div className="mb-5 grid grid-cols-2 gap-3 rounded-lg border border-white/10 bg-white/5 p-4 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max Hold</p>
              <p className="mt-1 text-lg font-bold text-white">{policy.maxHoldMinutes} <span className="text-xs font-normal text-muted-foreground">min</span></p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Booking Fee</p>
              <p className="mt-1 text-lg font-bold text-orange-400">{(policy.bookingFee ?? 0).toLocaleString('en-US')} <span className="text-xs font-normal text-muted-foreground">VND</span></p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cancellation Refund</p>
              <p className="mt-1 text-lg font-bold text-orange-400">{policy.refundPercent}<span className="text-xs font-normal text-muted-foreground">%</span></p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reservations</p>
              <p className={`mt-1 text-sm font-bold ${policy.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {policy.isActive ? '✓ Enabled' : '✗ Disabled'}
              </p>
            </div>
          </div>
        )}
        <form onSubmit={onSubmit} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Max Hold Time (minutes)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="30"
                value={form.maxHoldMinutes}
                onChange={(e) => setForm((f) => ({ ...f, maxHoldMinutes: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">
                Reservation auto-cancels if customer doesn't check in within this time.
              </p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cancellation Refund (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="80"
                value={form.refundPercent}
                onChange={(e) => setForm((f) => ({ ...f, refundPercent: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">
                Percentage refunded when customer cancels a reservation.
              </p>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Booking Fee (VND)
              </label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={form.bookingFee}
                onChange={(e) => setForm((f) => ({ ...f, bookingFee: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">
                Flat deposit charged at booking when no end time is provided. Set 0 to disable.
              </p>
            </div>
          </div>

          {/* Pricing info — read-only note */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-400">
            <span className="font-semibold">💡 Automatic fee calculation: </span>
            The system splits the reservation timeframe into regular and peak hours, applies the correct rate for each portion, and sums them.
            Configure rates on the <span className="font-semibold">Pricing</span> page.
          </div>

          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              className="h-4 w-4 rounded"
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span className="font-medium">Enable reservations</span>
            <span className="text-xs text-muted-foreground">(uncheck to disable the reservation feature)</span>
          </label>

          {policy?._id ? (
            <p className="text-xs text-muted-foreground">
              Editing current policy (ID: …{policy._id.slice(-6)}).
            </p>
          ) : null}

          {message ? (
            <div
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm
                ${message.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}
            >
              {message.type === 'success'
                ? <CheckCircle2 size={14} />
                : <AlertTriangle size={14} />}
              {message.text}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Policy'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
