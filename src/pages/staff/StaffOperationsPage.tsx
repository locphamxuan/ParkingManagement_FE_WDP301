import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BellRing, CheckCircle2, RefreshCcw, ScanLine, ShieldAlert, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';

type OperationsMode = 'full' | 'handover';

interface StaffOperationsPageProps {
  mode?: OperationsMode;
}

type VehicleKind = 'car' | 'motorcycle';
type PaymentKind = 'cash' | 'wallet' | 'qr';
type OperationMode = 'check-in' | 'check-out';

const quickActions = [
  { title: 'Nhận xe vào bãi', desc: 'Check-in nhanh, ghi nhận biển số và cổng vào.', icon: ScanLine, mode: 'check-in' as OperationMode },
  { title: 'Xử lý xe ra', desc: 'Chọn session đang mở để checkout và thu phí.', icon: CheckCircle2, mode: 'check-out' as OperationMode },
  { title: 'Đối soát cổng', desc: 'Rà nhanh session mở và trạng thái thanh toán.', icon: Wallet, mode: 'check-out' as OperationMode },
  { title: 'Bàn giao ca', desc: 'Chuẩn bị checklist cuối ca cho ca sau.', icon: AlertTriangle, mode: 'check-in' as OperationMode },
];

const statusTone: Record<ParkingSession['status'], 'ok' | 'warning' | 'review'> = {
  active: 'ok',
  completed: 'review',
  cancelled: 'warning',
};

const fmtTime = (value: string | null | undefined) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

export function StaffOperationsPage({ mode = 'full' }: StaffOperationsPageProps) {
  const { buildingId, building } = useBuildingContext();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleKind>('car');
  const [gate, setGate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentKind>('cash');
  const [opMessage, setOpMessage] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<OperationMode>('check-in');
  const [reservationCode, setReservationCode] = useState('');
  const [walletPlate, setWalletPlate] = useState('');
  const [walletAmount, setWalletAmount] = useState('');

  const title = mode === 'handover' ? 'Bàn giao ca & điều phối cuối ca' : 'Trung tâm vận hành Staff';

  const refreshSessions = useCallback(() => {
    setLoading(true);
    staffApi.getActiveSessions()
      .then((res) => {
        const rows = (res as any)?.data?.items ?? (res as any)?.data ?? [];
        setSessions(Array.isArray(rows) ? rows : []);
        setError(null);
        setSelectedSessionId((current) => current || ((Array.isArray(rows) ? rows : [])[0]?._id || ''));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [building?.preview]);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions, reloadTick]);

  useEffect(() => {
    if (!selectedSessionId && sessions[0]?._id) {
      setSelectedSessionId(sessions[0]._id);
    }
  }, [selectedSessionId, sessions]);

  const metrics = useMemo(
    () => [
      { label: 'Phiên đang mở', value: sessions.filter((s) => s.status === 'active').length, delta: 'Cập nhật từ API staff' },
      { label: 'Đã thanh toán', value: sessions.filter((s) => s.paymentStatus === 'paid').length, delta: 'Hóa đơn đã khớp' },
      { label: 'Chờ thanh toán', value: sessions.filter((s) => s.paymentStatus === 'pending').length, delta: 'Cần xử lý checkout' },
      { label: 'Tổng phiên', value: sessions.length, delta: 'Theo tòa nhà hiện chọn' },
    ],
    [sessions]
  );

  const selectedSession = sessions.find((session) => session._id === selectedSessionId) ?? null;
  const activeCheckoutSession = selectedSession && selectedSession.status === 'active' ? selectedSession : sessions.find((session) => session.status === 'active') ?? selectedSession;
  const selectedSessionHint = activeCheckoutSession
    ? `${activeCheckoutSession.plateNumber} · ${activeCheckoutSession.gate?.name ?? 'chưa rõ cổng'} · ${activeCheckoutSession.paymentStatus}`
    : 'Chưa có session đang mở để checkout';

  const columns: DataColumn<ParkingSession>[] = [
    { key: 'plateNumber', title: 'Biển số' },
    { key: 'vehicleType', title: 'Loại xe', render: (row) => (row.vehicleType ? `${row.vehicleType.name} (${row.vehicleType.code})` : '—') },
    { key: 'gate', title: 'Cổng', render: (row) => row.gate?.name ?? '—' },
    { key: 'checkIn', title: 'Vào', render: (row) => fmtTime(row.checkIn) },
    { key: 'checkOut', title: 'Ra', render: (row) => fmtTime(row.checkOut) },
    { key: 'paymentStatus', title: 'Thanh toán', render: (row) => <StatusBadge status={row.paymentStatus} /> },
    { key: 'status', title: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const selectOperation = (nextMode: OperationMode) => {
    setActiveForm(nextMode);
    setOpMessage(null);
  };

  const focusCheckout = (sessionId?: string) => {
    if (sessionId) {
      setSelectedSessionId(sessionId);
    }
    selectOperation('check-out');
  };

  const onCheckIn = async () => {
    setOpMessage(null);
    try {
      await staffApi.checkIn({
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleType: vehicleType === 'motorcycle' ? 'motorcycle' : 'car',
        gate: gate.trim() || undefined,
        buildingId: buildingId || undefined,
      });
      setOpMessage('Đã tạo check-in thành công.');
      setPlateNumber('');
      setGate('');
      setActiveForm('check-out');
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage(err instanceof Error ? err.message : 'Không thể check-in');
    }
  };

  const onCheckOut = async () => {
    if (!selectedSession) return;
    setOpMessage(null);
    try {
      await staffApi.checkOut(selectedSession._id);
      setOpMessage('Đã checkout thành công.');
      setPaymentMethod('cash');
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage(err instanceof Error ? err.message : 'Không thể checkout');
    }
  };

  const onCheckInReservation = async () => {
    if (!reservationCode.trim()) return;
    setOpMessage(null);
    try {
      await staffApi.checkInReservation(reservationCode.trim());
      setOpMessage('Đã check-in reservation thành công.');
      setReservationCode('');
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage(err instanceof Error ? err.message : 'Không thể check-in reservation');
    }
  };

  const onProcessWallet = async () => {
    if (!walletPlate.trim() || !walletAmount.trim()) return;
    setOpMessage(null);
    try {
      await staffApi.processWallet({
        plateNumber: walletPlate.trim().toUpperCase(),
        amount: Number(walletAmount),
      });
      setOpMessage('Đã xử lý giao dịch ví thành công.');
      setWalletPlate('');
      setWalletAmount('');
    } catch (err) {
      setOpMessage(err instanceof Error ? err.message : 'Không thể xử lý ví');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950 to-orange-950/45 p-6 shadow-[0_22px_54px_rgba(15,23,42,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(249,115,22,0.14),transparent_22%),radial-gradient(circle_at_82%_14%,rgba(251,191,36,0.10),transparent_18%)]" />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
              <ShieldAlert size={12} /> Vận hành ca trực
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-white">{title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              {building ? `${building.code} · ${building.name}` : 'Chưa chọn tòa nhà'} · xử lý check-in, check-out và các thao tác vận hành từ dữ liệu BE thật.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status="active" />
            <StatusBadge status="warning" />
            <StatusBadge status="review" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-white/10 bg-white/5">
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{loading ? '–' : String(metric.value)}</p>
              <p className="mt-1 text-xs text-slate-400">{metric.delta}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {mode !== 'handover' ? (
        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Thao tác nhanh</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => selectOperation(action.mode)}
                    className="group rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-left transition hover:border-orange-400/25 hover:bg-slate-900/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-orange-400/15 bg-orange-500/10 p-2.5 text-orange-300">
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{action.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{action.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Phiên đang xử lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-slate-400">Đang tải...</p>
              ) : error ? (
                <p className="text-sm text-rose-300">{error}</p>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-slate-400">Chưa có phiên nào.</p>
              ) : (
                sessions.slice(0, 4).map((session) => (
                  <button
                    key={session._id}
                    type="button"
                    onClick={() => focusCheckout(session._id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      selectedSessionId === session._id
                        ? 'border-orange-400/30 bg-orange-500/10'
                        : 'border-white/10 bg-slate-950/50 hover:border-orange-400/25 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="mt-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                      {session.paymentStatus}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">{session.plateNumber}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {session.gate?.name ?? 'Cổng chưa xác định'} · {session.vehicleType ? `${session.vehicleType.name} (${session.vehicleType.code})` : 'Loại xe chưa xác định'}
                      </p>
                    </div>
                    <StatusBadge status={statusTone[session.status]} />
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Luồng thao tác thực tế</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => selectOperation('check-in')}
                className={`rounded-2xl border p-4 text-left transition ${
                  activeForm === 'check-in'
                    ? 'border-orange-400/30 bg-orange-500/10'
                    : 'border-white/10 bg-slate-950/50 hover:border-orange-400/25 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Check-in</p>
                    <p className="mt-1 text-sm font-semibold text-white">Nhận xe vào bãi</p>
                  </div>
                  <ScanLine size={18} className="text-orange-300" />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">Nhập biển số, loại xe và cổng vào. Hệ thống tạo session mới ngay trên BE.</p>
              </button>

              <button
                type="button"
                onClick={() => selectOperation('check-out')}
                className={`rounded-2xl border p-4 text-left transition ${
                  activeForm === 'check-out'
                    ? 'border-orange-400/30 bg-orange-500/10'
                    : 'border-white/10 bg-slate-950/50 hover:border-orange-400/25 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Check-out</p>
                    <p className="mt-1 text-sm font-semibold text-white">Xử lý xe ra bãi</p>
                  </div>
                  <CheckCircle2 size={18} className="text-orange-300" />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">Chọn session đang mở, xác nhận thanh toán rồi hoàn tất checkout.</p>
              </button>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Reservation check-in</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input value={reservationCode} onChange={(e) => setReservationCode(e.target.value)} placeholder="Mã reservation" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />
                  <Button type="button" onClick={onCheckInReservation} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110">
                    Check-in reservation
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Wallet transaction</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr,0.7fr]">
                  <Input value={walletPlate} onChange={(e) => setWalletPlate(e.target.value)} placeholder="Biển số" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />
                  <Input value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="Số tiền" inputMode="numeric" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />
                </div>
                <Button type="button" onClick={onProcessWallet} className="mt-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 hover:brightness-110">
                  Process wallet
                </Button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Ngữ cảnh thao tác</p>
                  <p className="mt-1 text-sm font-semibold text-white">{activeForm === 'check-in' ? 'Đang nhập xe vào bãi' : 'Đang chọn session để checkout'}</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                  {building ? building.code : 'No building selected'}
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {activeForm === 'check-in' ? (
                  <>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Biển số</label>
                      <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="59X1-123.45" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Loại xe</label>
                      <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleKind)} className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none">
                        <option value="car">Ô tô</option>
                        <option value="motorcycle">Xe máy</option>
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Cổng vào</label>
                      <Input value={gate} onChange={(e) => setGate(e.target.value)} placeholder="Cổng A" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />
                    </div>
                    <div className="rounded-2xl border border-orange-400/15 bg-orange-500/8 p-4 md:col-span-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Luồng check-in</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">Xác minh biển số, chọn đúng cổng và loại xe, sau đó tạo session mới để backend ghi nhận xe đang gửi.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Session đang mở</label>
                      <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none">
                        <option value="">Chọn session để checkout</option>
                        {sessions.filter((session) => session.status === 'active').map((session) => (
                          <option key={session._id} value={session._id}>
                            {session.plateNumber} · {session.gate?.name ?? 'Cổng chưa rõ'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Thông tin session</label>
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{selectedSessionHint}</div>
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Phương thức thanh toán</label>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {[
                          { value: 'cash', label: 'Tiền mặt' },
                          { value: 'wallet', label: 'Ví điện tử' },
                          { value: 'qr', label: 'QR' },
                        ].map((method) => (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => setPaymentMethod(method.value as PaymentKind)}
                            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${paymentMethod === method.value ? 'border-orange-400/30 bg-orange-500/10 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:border-orange-400/20 hover:bg-white/8'}`}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-orange-400/15 bg-orange-500/8 p-4 md:col-span-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Luồng check-out</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">Chọn đúng session đang mở, xác nhận phương thức thanh toán rồi BE sẽ đóng session và cập nhật trạng thái.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {activeForm === 'check-out' ? (
                <Button onClick={onCheckOut} disabled={!selectedSession || loading} className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                  <CheckCircle2 size={14} /> Checkout thật
                </Button>
              ) : (
                <Button onClick={onCheckIn} disabled={!plateNumber.trim() || loading} className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                  <ScanLine size={14} /> Check-in thật
                </Button>
              )}
              <Button variant="secondary" onClick={refreshSessions} className="gap-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10">
                <RefreshCcw size={14} /> Làm mới dữ liệu
              </Button>
              <Button variant="ghost" className="gap-2 rounded-xl text-slate-300 hover:bg-white/6 hover:text-white">
                <BellRing size={14} /> Báo manager
              </Button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {['Xác minh biển số', 'Chọn cổng phù hợp', 'Lưu audit log'].map((step, index) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Bước 0{index + 1}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{step}</p>
                </div>
              ))}
            </div>

            {opMessage ? <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">{opMessage}</div> : null}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Bảng điều phối cuối ca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-orange-400/15 bg-orange-500/8 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Ưu tiên hôm nay</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Kiểm kê số xe tồn và session quá hạn.</li>
                <li>• Đối chiếu tiền mặt, QR, ví và checkout pending.</li>
                <li>• Ghi rõ lý do nếu có manual override hoặc refund.</li>
              </ul>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Xe tồn</p>
                <p className="mt-2 text-2xl font-semibold text-white">{sessions.filter((s) => s.status === 'active').length}</p>
                <p className="mt-1 text-xs text-slate-400">Lấy trực tiếp từ API</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Đã thanh toán</p>
                <p className="mt-2 text-2xl font-semibold text-white">{sessions.filter((s) => s.paymentStatus === 'paid').length}</p>
                <p className="mt-1 text-xs text-slate-400">Cập nhật theo BE</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Lưu ý</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Mọi thao tác check-in/check-out giờ đã nối vào API staff thật. Nếu BE chưa mở endpoint cho sự cố thì màn đó vẫn là bảng nghiệp vụ nội bộ.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Danh sách phiên từ BE</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-400">Đang tải...</p>
          ) : error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có phiên nào.</p>
          ) : (
            <DataTable title={`Phiên gửi xe (${sessions.length})`} rows={sessions} columns={columns} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
