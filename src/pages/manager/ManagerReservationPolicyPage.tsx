import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type ReservationPolicy } from '@/services/manager/managerApi';

interface FormState {
  maxHoldMinutes: string;
  refundPercent: string;
  depositPercent: string;
  maxAdvanceDays: string;
  maxDurationHours: string;
  overstayPenaltyPercent: string;
  cancellationCutoffHours: string;
  isActive: boolean;
}

const toForm = (p: ReservationPolicy | null): FormState => ({
  maxHoldMinutes: String(p?.maxHoldMinutes ?? 30),
  refundPercent: String(p?.refundPercent ?? 80),
  depositPercent: String(p?.depositPercent ?? 15),
  maxAdvanceDays: String(p?.maxAdvanceDays ?? 7),
  maxDurationHours: String(p?.maxDurationHours ?? 24),
  overstayPenaltyPercent: String(p?.overstayPenaltyPercent ?? 0),
  cancellationCutoffHours: String(p?.cancellationCutoffHours ?? 0),
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
    managerApi.reservationPolicy
      .get(buildingId)
      .then((res) => {
        setPolicy(res.data.item);
        setForm(toForm(res.data.item));
      })
      .catch((err) => setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' }))
      .finally(() => setLoading(false));
  }, [buildingId]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await managerApi.reservationPolicy.update(buildingId, {
        maxHoldMinutes: Number(form.maxHoldMinutes),
        refundPercent: Number(form.refundPercent),
        depositPercent: Number(form.depositPercent),
        maxAdvanceDays: Number(form.maxAdvanceDays),
        maxDurationHours: Number(form.maxDurationHours),
        overstayPenaltyPercent: Number(form.overstayPenaltyPercent),
        cancellationCutoffHours: Number(form.cancellationCutoffHours),
        isActive: form.isActive,
      });
      setPolicy(res.data.item);
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

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservation policy</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">Max hold time (minutes)</label>
              <Input
                type="number"
                min={0}
                value={form.maxHoldMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxHoldMinutes: e.target.value }))
                }
              />
              <p className="text-[11px] text-muted-foreground">Reservations auto-cancel if the customer does not check in within this window.</p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">% Refund on cancellation</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.refundPercent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, refundPercent: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">% Deposit on booking</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.depositPercent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, depositPercent: e.target.value }))
                }
              />
              <p className="text-[11px] text-muted-foreground">The customer pays this percentage when booking.</p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">% Remaining (charged after checkout)</label>
              <Input
                type="number"
                value={Math.max(0, 100 - Number(form.depositPercent || 0))}
                readOnly
                disabled
                className="cursor-not-allowed opacity-70"
              />
              <p className="text-[11px] text-muted-foreground">Auto-calculated = 100% − deposit %. The customer pays this portion at exit (checkout).</p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">Max advance booking (days)</label>
              <Input
                type="number"
                min={1}
                value={form.maxAdvanceDays}
                onChange={(e) => setForm((f) => ({ ...f, maxAdvanceDays: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">Customers may only book this many days in advance.</p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">Max duration / booking (hours)</label>
              <Input
                type="number"
                min={1}
                value={form.maxDurationHours}
                onChange={(e) => setForm((f) => ({ ...f, maxDurationHours: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">Each booking must not exceed this number of hours.</p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">% Overstay penalty</label>
              <Input
                type="number"
                min={0}
                value={form.overstayPenaltyPercent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, overstayPenaltyPercent: e.target.value }))
                }
              />
              <p className="text-[11px] text-muted-foreground">Penalty surcharge applied to overstay time. 0 = charge normal rate only, no penalty.</p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                Cancellation cutoff (hours before booking)
              </label>
              <Input
                type="number"
                min={0}
                value={form.cancellationCutoffHours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cancellationCutoffHours: e.target.value }))
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Guests must cancel at least this many hours before the booking time. 0 = cancel any time before booking.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
              <span>Allow customers to book in advance</span>
            </label>
          </div>

          {policy?._id ? (
            <p className="text-xs text-muted-foreground">
              Editing the current policy ({policy._id.slice(-6)}).
            </p>
          ) : null}

          {message ? (
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {message.text}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button disabled={saving}>{saving ? 'Saving...' : 'Save policy'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
