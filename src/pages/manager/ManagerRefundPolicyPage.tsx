import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ShieldCheck, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi } from '@/services/manager/managerApi';

export function ManagerRefundPolicyPage() {
  const { buildingId } = useBuildingContext();
  const [refundPercent, setRefundPercent] = useState<string>('80');
  const [ruleViolationFee, setRuleViolationFee] = useState<string>('100000');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    managerApi.refundPolicy
      .get(buildingId)
      .then((res) => {
        const item = res.data.item;
        setRefundPercent(String(item?.refundPercent ?? 80));
        setRuleViolationFee(String(item?.ruleViolationFee ?? 100000));
        setIsActive(item?.isActive ?? true);
      })
      .catch((err) => setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' }))
      .finally(() => setLoading(false));
  }, [buildingId]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const pct = Number(refundPercent);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        throw new Error('Refund percentage must be between 0 and 100');
      }
      const ruleFee = Number(ruleViolationFee);
      if (isNaN(ruleFee) || ruleFee < 0) {
        throw new Error('Rule violation fee must be a valid positive amount');
      }

      await managerApi.refundPolicy.update(buildingId, {
        refundPercent: pct,
        ruleViolationFee: ruleFee,
        isActive,
      });
      setMessage({ type: 'success', text: 'Building fine and refund policies saved successfully.' });
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
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto md:mx-0">
      {/* Premium Header Hero Card */}
      <div
        className="relative overflow-hidden rounded-3xl border border-blue-100/80 p-6 shadow-md transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(224,242,254,0.6) 0%, rgba(255,255,255,0.8) 50%, rgba(219,234,254,0.4) 100%)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.08),transparent_70%)] pointer-events-none blur-2xl" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
            Building Policies
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-600 stroke-[2.5]" />
            Building Fine & Refund Policies
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Configure the fine rates for violations (lost ticket, rule breach) and cancellation refund percentage. Staff will read-only apply these configured fines.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card
        style={{
          background: 'rgba(255, 255, 255, 0.45)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.015)',
          backdropFilter: 'blur(8px)',
        }}
        className="rounded-3xl overflow-hidden"
      >
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-6">

            <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-4 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-2">
                ⚖️ Penalty Fee Rules (Manager configuration)
              </h3>

              {/* Penalty explanations */}
              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-[10px] text-rose-700 space-y-1.5 font-medium">
                <p className="font-bold text-rose-800 text-[11px]">📋 Cases where a penalty fee applies on the premises:</p>
                <div className="grid gap-1">
                  <div className="flex items-start gap-2"><span className="shrink-0 font-black">🚫</span><span><b>Wrong spot / row:</b> Vehicle parked in a slot it's not allowed to use (wrong vehicle type, wrong subscription row).</span></div>
                  <div className="flex items-start gap-2"><span className="shrink-0 font-black">⏰</span><span><b>Overstaying the limit (overstay):</b> Monthly package vehicle parked longer than the hours/day allowed by its package.</span></div>
                  <div className="flex items-start gap-2"><span className="shrink-0 font-black">🔧</span><span><b>Damaged parking equipment:</b> Damage to cameras, automatic gates, floor markings, or signage.</span></div>
                  <div className="flex items-start gap-2"><span className="shrink-0 font-black">📸</span><span><b>Plate mismatch / forged:</b> Camera-scanned plate doesn't match the plate registered in the system.</span></div>
                  <div className="flex items-start gap-2"><span className="shrink-0 font-black">🔒</span><span><b>Occupying another customer's slot:</b> Vehicle without the right to park in a slot reserved under another customer's fixed subscription.</span></div>
                  <div className="flex items-start gap-2"><span className="shrink-0 font-black">🚪</span><span><b>Gate entry/exit violation:</b> Deliberately bypassing the gate or skipping the check-in/out process.</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    🔧 Default violation penalty (VND)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="10000"
                    value={ruleViolationFee}
                    onChange={(e) => setRuleViolationFee(e.target.value)}
                    className="h-10 rounded-xl border-rose-200 bg-white font-extrabold text-rose-700"
                    required
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Applied to any of the violation cases above when staff/manager resolve an incident without entering a custom amount.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-650 uppercase tracking-wider block">
                Refund Percentage (%)
              </label>
              <div className="relative max-w-xs">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={refundPercent}
                  onChange={(e) => setRefundPercent(e.target.value)}
                  className="pr-12 h-11 rounded-xl border-slate-200/80 bg-white/70 focus:bg-white text-slate-800 font-extrabold focus:ring-blue-500/20"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  %
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                The percentage of the remaining package fee that will be refunded back to the user's wallet when they terminate their subscription.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-xs font-bold text-slate-700 select-none">
                Enable cancellation refunds
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 text-white font-extrabold flex items-center gap-2 shadow-md shadow-blue-500/10 hover:brightness-110 transition-all"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Policy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
