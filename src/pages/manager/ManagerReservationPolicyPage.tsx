import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ShieldCheck, Loader2, Save } from 'lucide-react';
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
    <div className="space-y-6 max-w-4xl mx-auto md:mx-0">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
            Billing & Reservations
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
            Reservation Policy
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Configure deposit, hold times, cancellation cutoff, and overstay penalties for reservations.
          </p>
        </div>
      </div>

      <Card className="border-2 border-blue-100 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="border-b border-blue-50 bg-blue-50/20 p-5">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-700">Advance reservation policy settings</CardTitle>
        </CardHeader>
        <CardContent className="p-5 text-slate-800">
          <form onSubmit={onSubmit} className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  Max hold time (minutes)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.maxHoldMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxHoldMinutes: e.target.value }))
                  }
                  className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
                />
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  The reservation auto-cancels if the guest does not check in within this window.
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  % Refund on cancellation
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.refundPercent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, refundPercent: e.target.value }))
                  }
                  className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
                />
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  The percentage of the deposit refunded back to the customer.
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  % Deposit on reservation
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.depositPercent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, depositPercent: e.target.value }))
                  }
                  className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
                />
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  The customer pays this percentage when reserving.
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  % Remaining (collected at checkout)
                </label>
                <Input
                  type="number"
                  value={Math.max(0, 100 - Number(form.depositPercent || 0))}
                  readOnly
                  disabled
                  className="cursor-not-allowed opacity-70 bg-slate-50 border-blue-100 text-slate-600 rounded-xl"
                />
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Auto-calculated = 100% − deposit %. The customer pays this on exit (checkout).
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  Max advance (days)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxAdvanceDays}
                  onChange={(e) => setForm((f) => ({ ...f, maxAdvanceDays: e.target.value }))}
                  className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
                />
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Customers can only reserve within this many days ahead.
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  Max duration / booking (hours)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxDurationHours}
                  onChange={(e) => setForm((f) => ({ ...f, maxDurationHours: e.target.value }))}
                  className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
                />
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Each reservation cannot exceed this many hours.
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  % Overstay penalty surcharge
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.overstayPenaltyPercent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, overstayPenaltyPercent: e.target.value }))
                  }
                  className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
                />
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Extra % added on top of the regular fee for time parked past the booked end time. 0 = no penalty.
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  Cancellation cutoff before start (hours)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.cancellationCutoffHours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cancellationCutoffHours: e.target.value }))
                  }
                  className="bg-white border-blue-100 text-slate-800 rounded-xl focus:border-blue-500/40"
                />
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  The customer must cancel at least this many hours before the start. 0 = cancel any time.
                </p>
              </div>

              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 md:col-span-2 select-none cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Allow customers to reserve in advance</span>
              </label>
            </div>

            {policy?._id && (
              <p className="text-[10px] text-slate-400 font-mono">
                Editing policy ID: <span className="font-bold">{policy._id}</span>
              </p>
            )}

            {message && (
              <div className={`rounded-xl border-2 p-4 text-xs font-bold transition-all duration-200 ${
                message.type === 'success' 
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm' 
                  : 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm'
              }`}>
                {message.text}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button disabled={saving} className="gap-2 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-[0.98]">
                {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="stroke-[2.5] mr-1.5" />}
                {saving ? 'Saving...' : 'Save policy'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
