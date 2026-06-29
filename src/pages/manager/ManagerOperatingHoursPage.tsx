import { useEffect, useMemo, useState } from 'react';
import { Clock, Save, Loader2, DoorOpen, DoorClosed } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimePicker } from '@/components/ui/time-picker';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi } from '@/services/manager/managerApi';

// Is `now` within [open, close]? Handles overnight windows (close < open).
function isOpenNow(open: string, close: string, now = new Date()): boolean {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const cur = now.getHours() * 60 + now.getMinutes();
  const o = toMin(open);
  const c = toMin(close);
  if (o === c) return false;
  return o < c ? cur >= o && cur < c : cur >= o || cur < c;
}

export function ManagerOperatingHoursPage() {
  const { buildingId, building } = useBuildingContext();

  const [open, setOpen] = useState('06:00');
  const [close, setClose] = useState('22:00');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (building?.operatingHours) {
      setOpen(building.operatingHours.open || '06:00');
      setClose(building.operatingHours.close || '22:00');
    }
  }, [building?.operatingHours]);

  const openNow = useMemo(() => isOpenNow(open, close), [open, close]);

  const handleSave = async () => {
    setNotice(null);
    if (open === close) {
      setNotice({ type: 'err', text: 'Opening and closing times must not be the same.' });
      return;
    }
    setSaving(true);
    try {
      await managerApi.updateOperatingHours(buildingId, { open, close });
      setNotice({ type: 'ok', text: 'Operating hours updated. Customers will see the open/closed status based on these hours.' });
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5 max-w-2xl">
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Operating hours</h1>
          <p className="text-sm text-muted-foreground">
            Set the building open and close times. Outside this window, customers see "closed".
          </p>
        </div>
      </div>

      {/* Live status preview */}
      <Card className={openNow ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50'}>
        <CardContent className="flex items-center gap-3 p-5">
          {openNow ? <DoorOpen size={24} className="text-emerald-600" /> : <DoorClosed size={24} className="text-rose-600" />}
          <div>
            <p className={`text-base font-bold ${openNow ? 'text-emerald-700' : 'text-rose-700'}`}>
              {openNow ? 'Currently open' : 'Currently closed'}
            </p>
            <p className="text-xs text-muted-foreground">
              {building ? `${building.code} · ${building.name}` : ''} · Time slots: {open} – {close}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-sky-100 shadow-sm">
        <CardHeader className="pb-3 border-b border-sky-100/50">
          <CardTitle className="text-sm text-slate-800">Configure opening / closing hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">Opening hours</label>
              <TimePicker value={open} onChange={setOpen} />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase tracking-[0.18em] text-slate-500 font-bold">Closing time</label>
              <TimePicker value={close} onChange={setClose} />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            Tip: if the lot is open overnight (e.g. open 22:00, close 06:00 next day), the system treats it as an overnight window.
          </p>

          {notice && (
            <div className={`rounded-xl border px-3 py-2 text-sm font-bold ${notice.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {notice.text}
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl text-xs font-bold">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save operating hours'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
