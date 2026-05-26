import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Plus, RefreshCcw, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { extractIncidents, staffApi, type StaffIncident } from '@/services/staff/staffApi';

type IncidentStatus = 'open' | 'investigating' | 'escalated' | 'resolved' | 'closed';

interface IncidentRow {
  id: string;
  type: string;
  building: string;
  severity: 'medium' | 'high' | 'critical';
  status: IncidentStatus;
  timestamp: string;
  note: string;
}

export function StaffIncidentsPage() {
  const { buildingId, building } = useBuildingContext();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [items, setItems] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidentType, setIncidentType] = useState('');
  const [incidentTarget, setIncidentTarget] = useState('');
  const [incidentNote, setIncidentNote] = useState('');
  const [incidentMessage, setIncidentMessage] = useState<string | null>(null);

  const mapIncident = (item: StaffIncident, index: number): IncidentRow => ({
    id: item.code || item._id || `INC-${1000 + index}`,
    type: item.type || 'Incident',
    building: item.building?.code || item.building?.name || building?.code || '—',
    severity: item.severity || 'medium',
    status: item.status || 'open',
    timestamp: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—',
    note: item.note || '—',
  });

  const refresh = () => {
    setLoading(true);
    setError(null);

    staffApi.incidents
      .list(buildingId)
      .then((res) => {
        const apiItems = extractIncidents(res.data as StaffIncident[] | { items: StaffIncident[] });
        const mapped = apiItems.map(mapIncident);
        setItems(mapped);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Tải sự cố thất bại');
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  const createIncident = async () => {
    if (!incidentType.trim()) return;

    setIncidentMessage(null);
    try {
      await staffApi.createIncident({
        type: incidentType.trim(),
        target: incidentTarget.trim() || undefined,
        note: incidentNote.trim() || undefined,
        buildingId: buildingId || undefined,
      });
      setIncidentMessage('Đã tạo sự cố thành công.');
      setIncidentType('');
      setIncidentTarget('');
      setIncidentNote('');
      refresh();
    } catch (err) {
      setIncidentMessage(err instanceof Error ? err.message : 'Không thể tạo sự cố');
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchesQuery = `${item.id} ${item.type} ${item.building} ${item.note}`.toLowerCase().includes(query.toLowerCase());
        const matchesSeverity = severity === 'all' || item.severity === severity;
        return matchesQuery && matchesSeverity;
      }),
    [items, query, severity]
  );

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 lg:grid-cols-[1.15fr,0.85fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Điều phối sự cố</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mở</p>
                <p className="mt-2 text-2xl font-semibold text-white">12</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Escalated</p>
                <p className="mt-2 text-2xl font-semibold text-white">5</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Đã xử lý</p>
                <p className="mt-2 text-2xl font-semibold text-white">27</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge status="open" />
              <StatusBadge status="investigating" />
              <StatusBadge status="escalated" />
              <StatusBadge status="resolved" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Tạo sự cố nhanh</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input value={incidentType} onChange={(e) => setIncidentType(e.target.value)} placeholder="Loại sự cố: mất vé, barrier lỗi, xe quá hạn..." className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />
            <Input value={incidentTarget} onChange={(e) => setIncidentTarget(e.target.value)} placeholder="Biển số / cổng / khu vực" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />
            <Input value={incidentNote} onChange={(e) => setIncidentNote(e.target.value)} placeholder="Ghi chú xử lý ban đầu" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />
            <Button type="button" onClick={createIncident} className="gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 hover:brightness-110">
              <Plus size={14} /> Tạo phiếu
            </Button>
            {incidentMessage ? <p className="text-xs text-slate-400">{incidentMessage}</p> : null}
          </CardContent>
        </Card>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">Đang tải dữ liệu sự cố từ API staff...</div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-white">Không lấy được dữ liệu sự cố từ BE</p>
              <p className="mt-1 leading-6">{error}</p>
            </div>
            <Button onClick={refresh} variant="secondary" className="gap-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10">
              <RefreshCcw size={14} /> Thử lại
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Danh sách sự cố</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <ShieldAlert className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm kiếm theo mã, loại sự cố, ghi chú..."
                className="pl-9 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
              />
            </div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="critical">Nguy cấp</option>
            </select>
          </div>

          <div className="mt-5 grid gap-3">
            {filtered.map((incident) => (
              <div key={incident.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{incident.id}</p>
                    <StatusBadge status={incident.severity} />
                    <StatusBadge status={incident.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{incident.type} · {incident.building}</p>
                  <p className="mt-1 text-sm text-slate-400">{incident.note}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    <Clock3 size={12} className="mr-1 inline-block" /> {incident.timestamp}
                  </div>
                  <Button variant="secondary" className="gap-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10">
                    <ArrowRight size={14} /> Chi tiết
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-6 text-sm text-slate-400">
                Không tìm thấy sự cố phù hợp.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Open', description: 'Sự cố mới cần ghi nhận', icon: AlertTriangle },
          { label: 'Investigating', description: 'Đang xác minh hiện trường', icon: ShieldAlert },
          { label: 'Resolved', description: 'Đã khép hồ sơ và audit', icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="border-white/10 bg-white/5">
              <CardContent className="flex items-start gap-3 p-5">
                <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/10 p-2.5 text-emerald-300">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-semibold text-white">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}