import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCcw, ScanLine, QrCode, Loader2, AlertCircle, Sparkles, UserPlus, Car, Bike } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';
import { AIAutoScanZone } from '@/components/staff/AIAutoScanZone';
import { QRCodeScannerModal } from '@/components/staff/QRCodeScannerModal';
import { api } from '@/services/apiClient';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentKind>('cash');
  const [opMessage, setOpMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [activeForm, setActiveForm] = useState<OperationMode>('check-in');

  // Scanner States
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Binding License Plate to Customer Account states
  const [isBindingModalOpen, setIsBindingModalOpen] = useState(false);
  const [scannedPlateForBinding, setScannedPlateForBinding] = useState('');
  const [customerIdOrEmail, setCustomerIdOrEmail] = useState('');
  const [bindingLoading, setBindingLoading] = useState(false);
  const [bindingError, setBindingError] = useState<string | null>(null);
  const [foundCustomer, setFoundCustomer] = useState<{ id: string; fullName: string; email: string } | null>(null);
  const [plateAccountInfo, setPlateAccountInfo] = useState<{ hasAccount: boolean; user: any } | null>(null);
  const [plateToPromptBinding, setPlateToPromptBinding] = useState<string | null>(null);

  // Bank-transfer (VietQR via PayOS) modal
  const [bankTransfer, setBankTransfer] = useState<BankTransferState | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Reservation check-in
  const [reservationCode, setReservationCode] = useState('');
  const [allowedTypes, setAllowedTypes] = useState<string[]>(['CAR', 'MOTORCYCLE']);
  const [buildingFloors, setBuildingFloors] = useState<any[]>([]);

  // Fetch allowed vehicle types from floors of this building
  useEffect(() => {
    if (!buildingId) return;
    api.get(`/users/buildings/${buildingId}/floors`)
      .then((res: any) => {
        const floors = res?.data?.floors || [];
        setBuildingFloors(floors);
        const types = new Set<string>();
        floors.forEach((floor: any) => {
          if (floor.allowedVehicleTypes) {
            floor.allowedVehicleTypes.forEach((vt: any) => {
              if (vt.code) {
                types.add(vt.code.toUpperCase());
              }
            });
          }
        });
        setAllowedTypes(Array.from(types));
      })
      .catch((err) => {
        console.error('Failed to load building floors/vehicle types:', err);
      });
  }, [buildingId]);

  // Set default supported vehicle type when building allowedTypes changes
  useEffect(() => {
    if (allowedTypes.length > 0) {
      const hasCar = allowedTypes.includes('CAR');
      const hasMotorcycle = allowedTypes.includes('MOTORCYCLE');
      if (hasCar && !hasMotorcycle) {
        setVehicleType('car');
      } else if (hasMotorcycle && !hasCar) {
        setVehicleType('motorcycle');
      }
    }
  }, [allowedTypes]);

  // Helper to detect vehicle type from plate number format
  const detectTypeFromPlate = (plate: string): 'car' | 'motorcycle' => {
    const clean = plate.trim().toUpperCase();
    if (clean.length >= 3) {
      const parts = clean.split('-');
      const prefix = parts[0]?.trim() || '';
      if (prefix.length === 3) {
        return 'car';
      }
      if (/[A-Z]{2}$/.test(prefix)) {
        const letters = prefix.substring(2);
        if (['LD', 'DA', 'KT', 'MD'].includes(letters)) {
          return 'car';
        }
        return 'motorcycle';
      }
      if (/^\d{2}[A-Z]\d/.test(prefix)) {
        return 'motorcycle';
      }
    }
    return 'car';
  };

  // Auto-detect vehicle type from plate number format
  useEffect(() => {
    const cleanPlate = plateNumber.trim().toUpperCase();
    if (cleanPlate.length >= 3) {
      const detected = detectTypeFromPlate(cleanPlate);
      if (detected === 'motorcycle' && allowedTypes.includes('MOTORCYCLE')) {
        setVehicleType('motorcycle');
      } else if (detected === 'car' && allowedTypes.includes('CAR')) {
        setVehicleType('car');
      }
    }
  }, [plateNumber, allowedTypes]);

  // Get floors that support the selected vehicle type
  const recommendedFloors = useMemo(() => {
    const currentCode = vehicleType === 'car' ? 'CAR' : 'MOTORCYCLE';
    return buildingFloors
      .filter((floor: any) => {
        const allowed = floor.allowedVehicleTypes || [];
        return allowed.some((vt: any) => {
          const code = typeof vt === 'string' ? vt : vt.code;
          return String(code).toUpperCase() === currentCode;
        });
      })
      .map((floor: any) => floor.name);
  }, [buildingFloors, vehicleType]);

  // Warning when plate format does not match selected vehicle type
  const plateTypeWarning = useMemo(() => {
    const cleanPlate = plateNumber.trim().toUpperCase();
    if (cleanPlate.length >= 3) {
      const detected = detectTypeFromPlate(cleanPlate);
      if (detected !== vehicleType) {
        return `Warning: License plate format looks like a ${detected}, but you selected ${vehicleType}.`;
      }
    }
    return null;
  }, [plateNumber, vehicleType]);

  // Warning when building does not support the selected vehicle type
  const buildingSupportWarning = useMemo(() => {
    if (allowedTypes.length === 0) return null;
    const currentCode = vehicleType === 'car' ? 'CAR' : 'MOTORCYCLE';
    if (!allowedTypes.includes(currentCode)) {
      return `Warning: This building does not support ${vehicleType} parking.`;
    }
    return null;
  }, [allowedTypes, vehicleType]);

  const handleLprScanSuccess = (plate: string) => {
    setPlateNumber(plate);
    setOpMessage({ type: 'ok', text: `Plate recognized: ${plate}` });

    if (activeForm === 'check-out') {
      const matched = sessions.find(
        (s) => s.status === 'active' && s.plateNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') === plate.replace(/[^A-Z0-9]/g, '')
      );
      if (matched) {
        setSelectedSessionId(matched._id);
        setOpMessage({ type: 'ok', text: `Plate recognized: ${plate} (matched an active session)` });
      } else {
        setOpMessage({ type: 'err', text: `Plate recognized: ${plate} (no matching active session found)` });
      }
    }
  };

  // Resolve a scanned plate-QR token (PLT-...) → owner + plate, then reuse the LPR flow.
  const handlePlateQrScan = async (qrCode: string) => {
    try {
      const res = await staffApi.lookupPlateQr(qrCode);
      const data = (res as any)?.data;
      if (data?.found && data.plate?.plateNumber) {
        const ownerName = data.user?.fullName ? ` — ${data.user.fullName}` : '';
        handleLprScanSuccess(data.plate.plateNumber);
        setOpMessage({ type: 'ok', text: `Scanned plate QR: ${data.plate.plateNumber}${ownerName}` });
      } else {
        setOpMessage({ type: 'err', text: 'No plate matches the scanned QR code.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to look up plate QR.' });
    }
  };

  // Auto Lookup License Plate owner info
  useEffect(() => {
    const cleanPlate = plateNumber.trim().toUpperCase();
    if (cleanPlate.length >= 7) {
      staffApi.lookupPlate(cleanPlate)
        .then(res => {
          const info = (res as any)?.data;
          setPlateAccountInfo(info || null);
        })
        .catch(err => console.error('Failed to lookup plate:', err));
    } else {
      setPlateAccountInfo(null);
    }
  }, [plateNumber]);

  const handleLookupCustomer = async () => {
    if (!customerIdOrEmail.trim()) return;
    setBindingLoading(true);
    setBindingError(null);
    setFoundCustomer(null);
    try {
      const res = await staffApi.lookupUserQr(customerIdOrEmail.trim());
      const data = (res as any)?.data;
      if (data && data.hasAccount && data.user) {
        setFoundCustomer({
          id: data.user.id,
          fullName: data.user.fullName,
          email: data.user.email,
        });
      } else {
        setBindingError('No customer account matches the entered info.');
      }
    } catch (err) {
      setBindingError(err instanceof Error ? err.message : 'Failed to look up customer.');
    } finally {
      setBindingLoading(false);
    }
  };

  const handleBindPlate = async () => {
    if (!foundCustomer || !scannedPlateForBinding) return;
    setBindingLoading(true);
    setBindingError(null);
    try {
      await staffApi.addCustomerPlate(foundCustomer.id, {
        plateNumber: scannedPlateForBinding,
      });
      
      setOpMessage({
        type: 'ok',
        text: `Linked plate ${scannedPlateForBinding} to ${foundCustomer.fullName}'s account successfully!`,
      });
      
      setPlateAccountInfo({
        hasAccount: true,
        user: foundCustomer,
      });
      
      setIsBindingModalOpen(false);
      setCustomerIdOrEmail('');
      setFoundCustomer(null);
    } catch (err) {
      setBindingError(err instanceof Error ? err.message : 'Failed to link plate.');
    } finally {
      setBindingLoading(false);
    }
  };

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

  const selectOperation = (nextMode: OperationMode) => {
    setActiveForm(nextMode);
    setOpMessage(null);
  };

  const onCheckIn = async () => {
    setOpMessage(null);
    const currentPlate = plateNumber.trim().toUpperCase();
    const shouldPrompt = plateAccountInfo && !plateAccountInfo.hasAccount;

    try {
      await staffApi.checkIn({
        plateNumber: currentPlate,
        vehicleType: vehicleType === 'motorcycle' ? 'motorcycle' : 'car',
        building: buildingId || undefined,
      });
      setOpMessage({ type: 'ok', text: `Parking session created successfully for plate ${currentPlate}.` });
      setPlateNumber('');
      setActiveForm('check-out');
      setReloadTick((n) => n + 1);

      if (shouldPrompt) {
        setPlateToPromptBinding(currentPlate);
      }
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
              {/* AI Auto-Scan Zone */}
              <AIAutoScanZone onScanSuccess={handleLprScanSuccess} />

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

                      {/* Member accounts check-in info */}
                      {plateNumber.trim().length >= 7 && plateAccountInfo && plateAccountInfo.hasAccount && (
                        <div className="mt-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2 animate-pulse hover:animate-none">
                          <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <p className="text-xs text-emerald-300">
                            Member: <strong className="text-white">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email || 'No email'})
                          </p>
                        </div>
                      )}

                      {/* Not associated with a member account - prompt to bind */}
                      {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                        <div className="mt-2 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            <p className="text-xs text-orange-200">
                              Plate <strong className="text-white">{plateNumber.toUpperCase()}</strong> is not linked to any member account.
                            </p>
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              setScannedPlateForBinding(plateNumber.toUpperCase());
                              setIsBindingModalOpen(true);
                            }}
                            className="h-8 rounded-lg bg-orange-500 text-[10px] text-slate-950 font-bold hover:bg-orange-400 px-3 shrink-0"
                          >
                            Link Customer Account
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Vehicle Type</label>
                      <div className="flex gap-2 p-1 rounded-xl bg-slate-950 border border-white/10">
                        <button
                          type="button"
                          disabled={!allowedTypes.includes('CAR')}
                          onClick={() => setVehicleType('car')}
                          className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-bold transition-all duration-300 ${
                            vehicleType === 'car'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-105'
                              : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent'
                          }`}
                        >
                          <Car size={14} />
                          Car {!allowedTypes.includes('CAR') && '(N/A)'}
                        </button>
                        <button
                          type="button"
                          disabled={!allowedTypes.includes('MOTORCYCLE')}
                          onClick={() => setVehicleType('motorcycle')}
                          className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-bold transition-all duration-300 ${
                            vehicleType === 'motorcycle'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-105'
                              : 'text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent'
                          }`}
                        >
                          <Bike size={14} />
                          Motorcycle {!allowedTypes.includes('MOTORCYCLE') && '(N/A)'}
                        </button>
                      </div>
                      {recommendedFloors.length > 0 && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-orange-300">
                          <span className="flex h-1.5 w-1.5 rounded-full bg-orange-400"></span>
                          <span>Allowed Floors: <strong>{recommendedFloors.join(', ')}</strong></span>
                        </div>
                      )}
                      {plateTypeWarning && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400">
                          <AlertCircle size={12} />
                          {plateTypeWarning}
                        </div>
                      )}
                      {buildingSupportWarning && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-400">
                          <AlertCircle size={12} />
                          {buildingSupportWarning}
                        </div>
                      )}
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
                  disabled={!plateNumber.trim() || loading || !!buildingSupportWarning || !!plateTypeWarning}
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
                  onClick={() => setIsQrModalOpen(true)}
                  className="shrink-0 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 gap-1.5"
                >
                  <QrCode size={14} /> Scan QR
                </Button>
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
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{s.plateNumber}</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        {s.reservation ? 'Reservation' : 'Walk-in'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
                      <p><span className="text-slate-500">Vehicle:</span> {s.vehicleType?.name ?? '—'}</p>
                      <p><span className="text-slate-500">Floor:</span> {s.slot?.floor?.name ?? '—'}</p>
                      <p><span className="text-slate-500">Slot:</span> {s.slot?.code ?? '—'}</p>
                      <p><span className="text-slate-500">Gate:</span> {s.entryGate?.code ?? '—'}</p>
                      <p className="col-span-2"><span className="text-slate-500">Check-in:</span> {fmtTime(s.checkIn)}</p>
                      <p className="col-span-2"><span className="text-slate-500">Check-out:</span> {s.checkOut ? fmtTime(s.checkOut) : '—'}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* QR Scanner Modal */}
      <QRCodeScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSuccess={(code) => {
          const trimmed = code.trim();
          if (trimmed.toUpperCase().startsWith('PLT-')) {
            // Per-plate QR token → identify the vehicle/owner and prefill the plate.
            handlePlateQrScan(trimmed);
          } else {
            setReservationCode(trimmed);
            setOpMessage({ type: 'ok', text: `Reservation QR scanned successfully: ${trimmed}` });
          }
          setIsQrModalOpen(false);
        }}
      />

      {/* Binding License Plate Modal */}
      {isBindingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl overflow-hidden relative"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Account Link</p>
                <h3 className="text-xl font-semibold text-white">Link License Plate</h3>
              </div>
              <button
                onClick={() => { setIsBindingModalOpen(false); setCustomerIdOrEmail(''); setFoundCustomer(null); setBindingError(null); }}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              You are linking plate <strong className="text-orange-300 font-mono text-sm">{scannedPlateForBinding}</strong> to the customer's member account.
            </p>

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Customer ID / Email / QR Code</label>
                <div className="flex gap-2">
                  <Input
                    value={customerIdOrEmail}
                    onChange={(e) => setCustomerIdOrEmail(e.target.value)}
                    placeholder="Enter customer ID, email, or QR code"
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && handleLookupCustomer()}
                  />
                  <Button
                    type="button"
                    onClick={handleLookupCustomer}
                    disabled={bindingLoading || !customerIdOrEmail.trim()}
                    className="rounded-xl bg-orange-500 text-slate-950 hover:bg-orange-400 shrink-0 text-xs px-4"
                  >
                    Check
                  </Button>
                </div>
              </div>

              {bindingLoading && (
                <div className="flex items-center gap-2 text-xs text-orange-300">
                  <Loader2 className="h-4 w-4 animate-spin animate-infinite" /> Processing...
                </div>
              )}

              {bindingError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                  <AlertCircle size={12} className="shrink-0" />
                  <span>{bindingError}</span>
                </div>
              )}

              {foundCustomer && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Member</p>
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <p>Name: <strong className="text-white">{foundCustomer.fullName}</strong></p>
                    <p>Email: <strong className="text-white">{foundCustomer.email}</strong></p>
                  </div>
                  <Button
                    onClick={handleBindPlate}
                    disabled={bindingLoading}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Confirm Link Plate 🎯
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => { setIsBindingModalOpen(false); setCustomerIdOrEmail(''); setFoundCustomer(null); setBindingError(null); }}
                disabled={bindingLoading}
                className="rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs px-4 h-9"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Proactive "Ask Customer to Bind Plate" Prompt Modal */}
      {plateToPromptBinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-3xl border border-orange-500/30 bg-gradient-to-b from-slate-950 to-slate-900 p-6 shadow-[0_0_50px_rgba(249,115,22,0.15)] overflow-hidden relative"
          >
            {/* Decorative background glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4 relative z-10">
              <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-400 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-400">AI Suggestion</p>
                <h3 className="mt-1 text-lg font-bold text-white">Ask Customer to Save Plate</h3>
              </div>
            </div>

            <div className="mt-6 space-y-4 relative z-10">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
                <p className="text-xs text-slate-400">Plate just checked in</p>
                <p className="mt-1 font-mono text-2xl font-black tracking-wider text-orange-300">{plateToPromptBinding}</p>
              </div>

              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-xs font-semibold text-orange-300 mb-1.5 flex items-center gap-1.5">
                  <UserPlus size={14} className="shrink-0" />
                  Suggested staff message to the customer:
                </p>
                <p className="text-sm italic text-slate-200 leading-relaxed">
                  "This plate isn't registered to an account yet. Would you like to save it to your member account so the gate opens automatically and you earn points next time?"
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
              <Button
                variant="secondary"
                onClick={() => setPlateToPromptBinding(null)}
                className="rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-xs px-4 h-11 transition-all duration-300"
              >
                No, Skip
              </Button>
              <Button
                onClick={() => {
                  setScannedPlateForBinding(plateToPromptBinding);
                  setPlateToPromptBinding(null);
                  setIsBindingModalOpen(true);
                }}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-orange-500/20 text-xs px-4 h-11 transition-all duration-300 flex items-center justify-center gap-1.5"
              >
                Yes, Link Now 🎯
              </Button>
            </div>
          </motion.div>
        </div>
      )}

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
