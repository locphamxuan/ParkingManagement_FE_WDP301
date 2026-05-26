import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type ReservationPolicy } from '@/services/manager/managerApi';

interface FormState {
  reservableRatio: string;
  maxHoldMinutes: string;
  refundPercent: string;
  minAdvanceMinutes: string;
  maxAdvanceHours: string;
  isActive: boolean;
}

const toForm = (p: ReservationPolicy | null): FormState => ({
  reservableRatio: String(p?.reservableRatio ?? 0.3),
  maxHoldMinutes: String(p?.maxHoldMinutes ?? 30),
  refundPercent: String(p?.refundPercent ?? 80),
  minAdvanceMinutes: String(p?.minAdvanceMinutes ?? 15),
  maxAdvanceHours: String(p?.maxAdvanceHours ?? 72),
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
        reservableRatio: Number(form.reservableRatio),
        maxHoldMinutes: Number(form.maxHoldMinutes),
        refundPercent: Number(form.refundPercent),
        minAdvanceMinutes: Number(form.minAdvanceMinutes),
        maxAdvanceHours: Number(form.maxAdvanceHours),
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
              <label className="text-xs uppercase text-muted-foreground">
                Reservable slot ratio (0–1)
              </label>
              <Input
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={form.reservableRatio}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reservableRatio: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                Max hold time (minutes)
              </label>
              <Input
                type="number"
                min={0}
                value={form.maxHoldMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxHoldMinutes: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                Refund % on cancellation
              </label>
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
              <label className="text-xs uppercase text-muted-foreground">
                Min advance (minutes)
              </label>
              <Input
                type="number"
                min={0}
                value={form.minAdvanceMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minAdvanceMinutes: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                Max advance (hours)
              </label>
              <Input
                type="number"
                min={0}
                value={form.maxAdvanceHours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxAdvanceHours: e.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
              <span>Allow reservations</span>
            </label>
          </div>

          {policy?._id ? (
            <p className="text-xs text-muted-foreground">
              Editing current policy ({policy._id.slice(-6)}).
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
