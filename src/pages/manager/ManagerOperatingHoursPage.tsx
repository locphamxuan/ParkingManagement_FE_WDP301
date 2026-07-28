import { useEffect, useMemo, useState } from 'react';
import { Clock, Save, Loader2, DoorOpen, DoorClosed } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TimePicker } from '@/components/ui/time-picker';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi } from '@/services/manager/managerApi';
import { isWithinOperatingWindow } from '@/utils/businessHours';

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

  // Badge phải tự đổi khi qua mốc mở/đóng dù manager không thao tác gì → tick mỗi phút.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const openNow = useMemo(() => isWithinOperatingWindow(open, close, now), [open, close, now]);

  const handleSave = async () => {
    setNotice(null);
    if (open === close) {
      setNotice({ type: 'err', text: 'Opening and closing times cannot be the same.' });
      return;
    }
    setSaving(true);
    try {
      await managerApi.updateOperatingHours(buildingId, { open, close });
      setNotice({ type: 'ok', text: 'Operating hours updated. Customers will see open/closed status based on these hours.' });
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto md:mx-0">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
            Facility Operations
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
            Operating Hours
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Set the building opening and closing times. Outside this window, customers will see "closed".
          </p>
        </div>
      </div>

      {/* Live status preview */}
      <Card className={`border-2 rounded-2xl transition-all duration-300 ${
        openNow 
          ? 'border-emerald-200 bg-emerald-50/80 shadow-sm shadow-emerald-500/5' 
          : 'border-rose-200 bg-rose-50/80 shadow-sm shadow-rose-500/5'
      }`}>
        <CardContent className="flex items-center gap-4 p-5 text-slate-800">
          <div className={`p-2.5 rounded-xl border-2 ${
            openNow 
              ? 'bg-emerald-100/50 border-emerald-200 text-emerald-600' 
              : 'bg-rose-100/50 border-rose-200 text-rose-600'
          }`}>
            {openNow ? <DoorOpen size={20} className="stroke-[2.5]" /> : <DoorClosed size={20} className="stroke-[2.5]" />}
          </div>
          <div>
            <p className={`text-sm font-extrabold uppercase tracking-wide ${openNow ? 'text-emerald-700' : 'text-rose-700'}`}>
              {openNow ? 'Currently open' : 'Currently closed'}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {building ? `${building.code} · ${building.name}` : ''} · Hours: <span className="font-bold text-slate-700 font-sans">{open} – {close}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-100 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="border-b border-blue-50 bg-blue-50/20 p-5">
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-700">Configure opening / closing hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5 text-slate-800">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Opening time</label>
              <TimePicker value={open} onChange={setOpen} />
            </div>
            <div className="grid gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Closing time</label>
              <TimePicker value={close} onChange={setClose} />
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            Tip: if the lot is open overnight (e.g. opens 22:00, closes 06:00 next day), the system treats it as an overnight window.
          </p>

          {notice && (
            <div className={`rounded-xl border-2 p-4 text-xs font-bold transition-all duration-200 ${
              notice.type === 'ok' 
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm' 
                : 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm'
            }`}>
              {notice.text}
            </div>
          )}

          <div className="pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2 h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-[0.98]">
              {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="stroke-[2.5] mr-1.5" />}
              {saving ? 'Saving...' : 'Save operating hours'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
