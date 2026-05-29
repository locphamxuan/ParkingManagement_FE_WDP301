import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCcw, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';

type VehicleKind = 'car' | 'motorcycle';
type PaymentKind = 'cash' | 'bank_transfer';
type OperationMode = 'check-in' | 'check-out';

interface BankTransferState {
  orderCode: number;
  checkoutUrl: string;
  amount: number;
  plate: string;
}

const fmtTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('en-US') : '—';

export function StaffOperationsPage() {
  const { buildingId, building } = useBuildingContext();

  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  // Form state
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleKind>('car');
  const [gate, setGate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentKind>('cash');
  const [opMessage, setOpMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [activeForm, setActiveForm] = useState<OperationMode>('check-in');

  // Bank-transfer (VietQR via PayOS) modal
  const [bankTransfer, setBankTransfer] = useState<BankTransferState | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Reservation check-in
  const [reservationCode, setReservationCode] = useState('');

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
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
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
      { label: 'Active', value: sessions.filter((s) => s.status === 'active').length },
      { label: 'Awaiting Payment', value: sessions.filter((s) => s.paymentStatus === 'pending').length },
      { label: 'Paid', value: sessions.filter((s) => s.paymentStatus === 'paid').length },
      { label: 'Total Sessions', value: sessions.length },
    ],
    [sessions],
  );

  const selectedSession = sessions.find((s) => s._id === selectedSessionId) ?? null;
  const activeSessions = sessions.filter((s) => s.status === 'active');

  const columns: DataColumn<ParkingSession>[] = [
    { key: 'plateNumber', title: 'Plate' },
    {
      key: 'vehicleType',
      title: 'Vehicle Type',
      render: (row) => (row.vehicleType ? `${row.vehicleType.name} (${row.vehicleType.code})` : '—'),
    },
    { key: 'entryGate', title: 'Gate', render: (row) => row.entryGate?.code ?? '—' },
    { key: 'checkIn', title: 'Entry', render: (row) => fmtTime(row.checkIn) },
    { key: 'checkOut', title: 'Exit', render: (row) => fmtTime(row.checkOut) },
    {
      key: 'paymentStatus',
      title: 'Payment',
      render: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const selectOperation = (nextMode: OperationMode) => {
    setActiveForm(nextMode);
    setOpMessage(null);
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
      setOpMessage({ type: 'ok', text: 'Check-in created successfully.' });
      setPlateNumber('');
      setGate('');
      setActiveForm('check-out');
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-in failed' });
    }
  };

  const onCheckOut = async () => {
    if (!selectedSession) return;
    setOpMessage(null);
    try {
      if (paymentMethod === 'bank_transfer') {
        // Create a VietQR (PayOS) link; session completes after the customer pays.
        const res = await staffApi.initiateSessionPayment(selectedSession._id);
        const d = (res as any)?.data;
        setBankTransfer({
          orderCode: d.orderCode,
          checkoutUrl: d.checkoutUrl,
          amount: d.amount,
          plate: d.plateNumber || selectedSession.plateNumber,
        });
        return;
      }
      await staffApi.checkOut(selectedSession._id, { paymentMethod: 'cash' });
      setOpMessage({ type: 'ok', text: 'Check-out completed successfully.' });
      setPaymentMethod('cash');
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-out failed' });
    }
  };

  const onVerifyBankTransfer = async () => {
    if (!bankTransfer) return;
    setVerifying(true);
    try {
      const res = await staffApi.verifySessionPayment(bankTransfer.orderCode);
      const status = (res as any)?.data?.status;
      if (status === 'success') {
        setBankTransfer(null);
        setPaymentMethod('cash');
        setOpMessage({ type: 'ok', text: 'Bank transfer received — session checked out.' });
        setReloadTick((n) => n + 1);
      } else if (status === 'cancelled' || status === 'expired') {
        setBankTransfer(null);
        setOpMessage({ type: 'err', text: `Payment ${status}. Please start checkout again.` });
      } else {
        setOpMessage({
          type: 'err',
          text: 'Payment not received yet. Ask the customer to finish the transfer, then verify again.',
        });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  const onCheckInReservation = async () => {
    if (!reservationCode.trim()) return;
    setOpMessage(null);
    try {
      await staffApi.checkInReservation(reservationCode.trim());
      setOpMessage({ type: 'ok', text: 'Reservation check-in completed successfully.' });
      setReservationCode('');
      setReloadTick((n) => n + 1);
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Reservation check-in failed' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="grid gap-6"
    >
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm">
        <div className="relative z-10 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Shift Operations</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Check-in / Check-out</h2>
            <p className="mt-1 text-sm text-slate-300">
              {building ? `${building.code} · ${building.name}` : 'No building selected'}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={refreshSessions}
            className="gap-2 self-start rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 lg:self-auto"
          >
            <RefreshCcw size={14} /> Refresh
          </Button>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="border-white/10 bg-white/5">
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{m.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{loading ? '–' : String(m.value)}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Main panel */}
      <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
        {/* Operation form */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Mode toggle */}
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
                    <p className="mt-1 text-sm font-semibold text-white">Vehicle Entry</p>
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
                    <p className="mt-1 text-sm font-semibold text-white">Vehicle Exit</p>
                  </div>
                  <CheckCircle2 size={18} className="text-orange-300" />
                </div>
              </button>
            </div>

            {/* Form fields */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mt-1 grid gap-4 md:grid-cols-2">
                {activeForm === 'check-in' ? (
                  <>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">License Plate</label>
                      <Input
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value)}
                        placeholder="59X1-123.45"
                        className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                        onKeyDown={(e) => e.key === 'Enter' && onCheckIn()}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Vehicle Type</label>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value as VehicleKind)}
                        className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                      >
                        <option value="car">Car</option>
                        <option value="motorcycle">Motorcycle</option>
                      </select>
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Entry Gate</label>
                      <Input
                        value={gate}
                        onChange={(e) => setGate(e.target.value)}
                        placeholder="Gate A"
                        className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Active Session</label>
                      <select
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
                      >
                        <option value="">Select session to check out</option>
                        {activeSessions.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.plateNumber} · {s.entryGate?.code ?? '—'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Payment Method</label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(
                          [
                            { value: 'cash', label: 'Cash' },
                            { value: 'bank_transfer', label: 'Bank Transfer' },
                          ] as const
                        ).map((method) => (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => setPaymentMethod(method.value)}
                            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                              paymentMethod === method.value
                                ? 'border-orange-400/30 bg-orange-500/10 text-white'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-orange-400/20 hover:bg-white/8'
                            }`}
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

            {/* Action button */}
            <div className="flex flex-wrap gap-2">
              {activeForm === 'check-out' ? (
                <Button
                  onClick={onCheckOut}
                  disabled={!selectedSession || loading}
                  className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 size={14} /> {paymentMethod === 'bank_transfer' ? 'Generate QR' : 'Checkout'}
                </Button>
              ) : (
                <Button
                  onClick={onCheckIn}
                  disabled={!plateNumber.trim() || loading}
                  className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ScanLine size={14} /> Check-in
                </Button>
              )}
            </div>

            {/* Reservation check-in section */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Advance Reservation Check-in</p>
              <div className="mt-3 flex gap-2">
                <Input
                  value={reservationCode}
                  onChange={(e) => setReservationCode(e.target.value)}
                  placeholder="Reservation code / ID"
                  className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  onKeyDown={(e) => e.key === 'Enter' && onCheckInReservation()}
                />
                <Button
                  type="button"
                  onClick={onCheckInReservation}
                  disabled={!reservationCode.trim()}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                >
                  Check-in
                </Button>
              </div>
            </div>

            {/* Feedback */}
            {opMessage ? (
              <div
                className={`rounded-2xl border p-4 text-sm ${
                  opMessage.type === 'ok'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                }`}
              >
                {opMessage.text}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Active sessions sidebar */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">All Session Parking Active</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : error ? (
              <p className="text-sm text-rose-300">{error}</p>
            ) : activeSessions.length === 0 ? (
              <p className="text-sm text-slate-400">No active sessions.</p>
            ) : (
              activeSessions.slice(0, 6).map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => {
                    setSelectedSessionId(s._id);
                    selectOperation('check-out');
                  }}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                    selectedSessionId === s._id
                      ? 'border-orange-400/30 bg-orange-500/10'
                      : 'border-white/10 bg-slate-950/50 hover:border-orange-400/25 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="mt-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                    {s.paymentStatus}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{s.plateNumber}</p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {s.entryGate?.code ?? '—'} ·{' '}
                      {s.vehicleType ? `${s.vehicleType.name}` : '—'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{fmtTime(s.checkIn)}</p>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* Full sessions table */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-slate-400">No sessions found.</p>
          ) : (
            <DataTable title={`Parking Sessions (${sessions.length})`} rows={sessions} columns={columns} />
          )}
        </CardContent>
      </Card>

      {/* Bank transfer (VietQR via PayOS) modal */}
      {bankTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Bank Transfer</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Collect Payment</h3>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Plate</span>
                <span className="font-semibold text-white">{bankTransfer.plate}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-400">Amount</span>
                <span className="font-mono text-lg font-bold text-amber-400">
                  {bankTransfer.amount.toLocaleString('en-US')} ₫
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              Open the payment page and let the customer scan the VietQR with their banking app. After they
              transfer, tap <span className="font-semibold text-white">Verify Payment</span> to confirm and
              check out.
            </p>
            <Button
              onClick={() => window.open(bankTransfer.checkoutUrl, '_blank', 'noopener')}
              className="mt-4 w-full gap-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Open Payment Page (QR)
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                onClick={onVerifyBankTransfer}
                disabled={verifying}
                className="gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
              >
                {verifying ? 'Verifying...' : 'Verify Payment'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setBankTransfer(null)}
                disabled={verifying}
                className="rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
