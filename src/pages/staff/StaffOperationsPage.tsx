import { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, RefreshCcw, ScanLine, Wallet } from 'lucide-react';
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

const statusTone: Record<ParkingSession['status'], 'ok' | 'warning' | 'review'> = {
  active: 'ok',
  completed: 'review',
  cancelled: 'warning',
};

const fmtTime = (value: string | null | undefined) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

export function StaffOperationsPage({ mode = 'full' }: StaffOperationsPageProps) {
  const { buildingId, building } = useBuildingContext();
  const isHandoverMode = mode === 'handover';

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
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [reservationCode, setReservationCode] = useState('');
  const [walletPlate, setWalletPlate] = useState('');
  const [walletAmount, setWalletAmount] = useState('');

  const title = isHandoverMode ? 'Bàn giao ca & điều phối cuối ca' : 'Trung tâm vận hành Staff';

  const refreshSessions = useCallback(() => {
    setLoading(true);
    staffApi
      .getActiveSessions()
      .then((res) => {
        const rows = (res as any)?.data?.items ?? (res as any)?.data ?? [];
        const list = Array.isArray(rows) ? rows : [];
        setSessions(list);
        setError(null);
        setSelectedSessionId((current) => current || list[0]?._id || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, []);

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
      { label: 'Phiên đang mở', value: sessions.filter((session) => session.status === 'active').length, delta: 'Cập nhật từ API staff' },
      { label: 'Đã thanh toán', value: sessions.filter((session) => session.paymentStatus === 'paid').length, delta: 'Hóa đơn đã khớp' },
      { label: 'Chờ thanh toán', value: sessions.filter((session) => session.paymentStatus === 'pending').length, delta: 'Cần xử lý checkout' },
      { label: 'Tổng phiên', value: sessions.length, delta: 'Theo tòa nhà hiện chọn' },
    ],
    [sessions]
  );

  const selectedSession = sessions.find((session) => session._id === selectedSessionId) ?? null;
  const activeCheckoutSession =
    selectedSession && selectedSession.status === 'active' ? selectedSession : sessions.find((session) => session.status === 'active') ?? selectedSession;
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
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm">
        <div className="relative z-10 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Vận hành ca trực</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-300">{building ? `${building.code} · ${building.name}` : 'Chưa chọn tòa nhà'}</p>
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

      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">{isHandoverMode ? 'Tóm tắt bàn giao' : 'Thao tác chính'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isHandoverMode ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Cần bàn giao</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{sessions.filter((session) => session.status === 'active').length}</p>
                    <p className="mt-1 text-sm text-slate-400">Phiên đang mở cần người ca sau tiếp nhận.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Lưu ý cuối ca</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                      <li>• Đối soát các phiên đang mở</li>
                      <li>• Chốt các xe chờ checkout</li>
                      <li>• Báo manager nếu có bất thường</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Phiên cần xử lý</p>
                      <p className="mt-1 text-sm font-semibold text-white">{activeCheckoutSession ? selectedSessionHint : 'Chưa có phiên mở'}</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                      {building ? building.code : 'No building selected'}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-1.5">
                    <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Session đang mở</label>
                    <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none">
                      <option value="">Chọn session để bàn giao</option>
                      {sessions.filter((session) => session.status === 'active').map((session) => (
                        <option key={session._id} value={session._id}>
                          {session.plateNumber} · {session.gate?.name ?? 'Cổng chưa rõ'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={onCheckOut} disabled={!selectedSession || loading} className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                      <CheckCircle2 size={14} /> Chốt phiên đang chọn
                    </Button>
                    <Button variant="ghost" className="gap-2 rounded-xl text-slate-300 hover:bg-white/6 hover:text-white">
                      <BellRing size={14} /> Báo manager
                    </Button>
                    <Button variant="secondary" onClick={refreshSessions} className="gap-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10">
                      <RefreshCcw size={14} /> Làm mới dữ liệu
                    </Button>
                  </div>

                  {opMessage ? <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">{opMessage}</div> : null}
                </div>
              </>
            ) : (
              <>
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
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setShowMoreActions((current) => !current)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/8">
                    {showMoreActions ? 'Ẩn thao tác thêm' : 'Thêm thao tác'}
                  </button>
                  <Button variant="secondary" onClick={refreshSessions} className="gap-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10">
                    <RefreshCcw size={14} /> Làm mới dữ liệu
                  </Button>
                </div>

                {showMoreActions ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Reservation</p>
                      <div className="mt-3 flex gap-2">
                        <Input value={reservationCode} onChange={(e) => setReservationCode(e.target.value)} placeholder="Mã reservation" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />
                        <Button type="button" onClick={onCheckInReservation} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110">
                          Check-in
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Wallet</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr,0.7fr]">
                        <Input value={walletPlate} onChange={(e) => setWalletPlate(e.target.value)} placeholder="Biển số" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />
                        <Input value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="Số tiền" inputMode="numeric" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500" />
                      </div>
                      <Button type="button" onClick={onProcessWallet} className="mt-3 rounded-xl bg-emerald-500 text-white hover:brightness-110">
                        <Wallet size={14} className="mr-2" /> Process wallet
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
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
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeForm === 'check-out' ? (
                    <Button onClick={onCheckOut} disabled={!selectedSession || loading} className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                      <CheckCircle2 size={14} /> Checkout thật
                    </Button>
                  ) : (
                    <Button onClick={onCheckIn} disabled={!plateNumber.trim() || loading} className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                      <ScanLine size={14} /> Check-in thật
                    </Button>
                  )}
                  <Button variant="ghost" className="gap-2 rounded-xl text-slate-300 hover:bg-white/6 hover:text-white">
                    <BellRing size={14} /> Báo manager
                  </Button>
                </div>

                {opMessage ? <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">{opMessage}</div> : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">{isHandoverMode ? 'Phiên cần bàn giao' : 'Phiên đang xử lý'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400">Đang tải...</p>
            ) : error ? (
              <p className="text-sm text-rose-300">{error}</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có phiên nào.</p>
            ) : (
              sessions.slice(0, 5).map((session) => (
                <button
                  key={session._id}
                  type="button"
                  onClick={() => focusCheckout(session._id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    selectedSessionId === session._id ? 'border-orange-400/30 bg-orange-500/10' : 'border-white/10 bg-slate-950/50 hover:border-orange-400/25 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="mt-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">{session.paymentStatus}</div>
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
