import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScanLine,
  AlertCircle,
  Car,
  Bike,
  ArrowLeft,
  ArrowRight,
  UserSquare,
  QrCode,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type PlateInfo } from '@/services/staff/staffApi';
import { LivePlateCamera, type PlateScanResult, type LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import { UserAccountInfoModal } from '@/components/staff/UserAccountInfoModal';
import { useCameraDevices, type CameraRole } from '@/hooks/useCameraDevices';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
import { normalizePlate } from '@/utils/plate';

type VehicleKind = 'car' | 'motorcycle';
type OperationMode = 'check-in' | 'check-out';

// Vehicle types the building supports (staff can always pick both). Placed at module scope to
// keep a stable reference — avoid the auto-detect effect re-running on each render and
// overwriting the staff's manual vehicle-type choice.
const ALLOWED_TYPES = ['CAR', 'MOTORCYCLE'];

export function StaffOperationsPage() {
  const { buildingId, building } = useBuildingContext();
  const { gates } = useAssignedGates();
  // The entry gate assigned to this staff for today's shift.
  const entryGate = gates.find((g) => g.direction === 'in' || g.direction === 'both');

  const [loading, setLoading] = useState(false);

  // Form state
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleKind>('car');
  const [opMessage, setOpMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Captured camera snapshots (saved to DB at check-in).
  const [plateImage, setPlateImage] = useState<string | null>(null);
  const [portraitImage, setPortraitImage] = useState<string | null>(null);
  // Imperative handles so we can grab a fresh frame from either camera at the
  // moment of check-in — guaranteeing BOTH plate + portrait images are saved.
  const plateCamRef = useRef<LiveCameraHandle>(null);
  const qrCamRef = useRef<LiveCameraHandle>(null);
  const portraitCamRef = useRef<LiveCameraHandle>(null);

  // Assign physical camera devices to each role (supports multiple real cameras).
  const { devices, assignment, assign, requestAndRefresh } = useCameraDevices();
  const [cameraSettingsOpen, setCameraSettingsOpen] = useState(false);
  // Number of DISTINCT assigned devices — needs 2+ for "open multiple cameras at once" to be meaningful.
  const distinctDeviceCount = new Set(
    [assignment.plate, assignment.portrait, assignment.qr].filter(Boolean),
  ).size;
  // Multi-camera mode: open all 3 simultaneously for simultaneous capture (counter with multiple cameras).
  const [multiCamMode, setMultiCamMode] = useState(() => distinctDeviceCount >= 2);

  // Sequential wizard: only 1 camera active per step.
  //  1: Identify vehicle (plate AI / QR) · 2: Capture portrait · 3: Confirm & check-in
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifyMode, setIdentifyMode] = useState<'plate' | 'qr'>('plate');

  // Plate → account info (display only; guest when no account)
  const [plateAccountInfo, setPlateAccountInfo] = useState<PlateInfo | null>(null);
  // True while a lookupPlate request is in-flight — hides account banners to prevent stale data flash.
  const [plateInfoLoading, setPlateInfoLoading] = useState(false);
  // AbortController for the in-flight lookupPlate request. Aborted synchronously in
  // handlePlateScanStart so the fetch is cancelled at the network level before React re-renders.
  const lookupAbortRef = useRef<AbortController | null>(null);
  // Floating package: when plate has an active package, staff must choose an empty slot.
  const [freeSlots, setFreeSlots] = useState<{ _id: string; code: string; floor?: { _id: string; name?: string; code?: string } | null }[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedFloorId, setSelectedFloorId] = useState('');

  // Reject check-in flow
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // User QR popup
  const [scannedUser, setScannedUser] = useState<{
    id: string; fullName: string; email: string; phone?: string | null;
    walletBalance?: number;
    activeSessions?: Array<{ id: string; plateNumber: string; entryTime: string; fee?: number }>;
  } | null>(null);

  // Both vehicle types supported by default (staff can always override)
  const allowedTypes = ALLOWED_TYPES;

  const detectTypeFromPlate = (plate: string): VehicleKind => {
    const clean = plate.trim().toUpperCase();
    if (clean.length >= 3) {
      const prefix = clean.split('-')[0]?.trim() || '';
      if (prefix.length === 3) return 'car';
      if (/[A-Z]{2}$/.test(prefix)) {
        const letters = prefix.substring(2);
        return ['LD', 'DA', 'KT', 'MD'].includes(letters) ? 'car' : 'motorcycle';
      }
      if (/^\d{2}[A-Z]\d/.test(prefix)) return 'motorcycle';
    }
    return 'car';
  };

  // Auto-detect vehicle type when the PLATE changes (do not overwrite a manual change).
  useEffect(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 3) {
      const detected = detectTypeFromPlate(clean);
      if (detected === 'motorcycle' && ALLOWED_TYPES.includes('MOTORCYCLE')) setVehicleType('motorcycle');
      else if (detected === 'car' && ALLOWED_TYPES.includes('CAR')) setVehicleType('car');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateNumber]);

  const plateTypeWarning = useMemo(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 3) {
      const detected = detectTypeFromPlate(clean);
      if (detected !== vehicleType) return `Warning: the plate looks like a ${detected === 'car' ? 'car' : 'motorcycle'}, but you selected ${vehicleType === 'car' ? 'car' : 'motorcycle'}.`;
    }
    return null;
  }, [plateNumber, vehicleType]);

  const buildingSupportWarning = useMemo(() => {
    if (allowedTypes.length === 0) return null;
    const code = vehicleType === 'car' ? 'CAR' : 'MOTORCYCLE';
    if (!allowedTypes.includes(code))
      return `This building does not support ${vehicleType === 'car' ? 'car' : 'motorcycle'} vehicles.`;
    return null;
  }, [allowedTypes, vehicleType]);

  // Auto-look up the plate owner whenever plateNumber changes.
  // Uses AbortController so the in-flight fetch is cancelled at the network level when
  // the plate changes or the component unmounts — no stale response can ever reach setState.
  useEffect(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length < 7) {
      setPlateAccountInfo(null);
      setPlateInfoLoading(false);
      return;
    }

    const controller = new AbortController();
    lookupAbortRef.current = controller;
    setPlateAccountInfo(null);
    setPlateInfoLoading(true);

    staffApi
      .lookupPlate(clean, controller.signal)
      .then((res) => {
        setPlateAccountInfo((res as { data?: PlateInfo })?.data ?? null);
        setPlateInfoLoading(false);
      })
      .catch((err: unknown) => {
        // AbortError = this request was cancelled intentionally — ignore silently.
        if ((err as { name?: string })?.name === 'AbortError') return;
        setPlateInfoLoading(false);
      });

    return () => {
      controller.abort();
      lookupAbortRef.current = null;
    };
  }, [plateNumber]);

  // Display-level guard: only render account info when the lookup result is for the
  // CURRENT plate. This catches any stale data that slips past the lookupReqId counter
  // (e.g. React 18 batching causes two plateNumber changes to merge into one render).
  // normalizePlate is idempotent on canonical form, so both sides produce identical strings.
  const accountMatchesCurrentPlate =
    plateAccountInfo !== null &&
    normalizePlate(plateAccountInfo.plateNumber) === normalizePlate(plateNumber);

  // Plate has active package → load empty slots for the building so staff can assign a spot.
  // Gated on accountMatchesCurrentPlate so stale plateAccountInfo never activates package flow.
  const hasActivePackage = accountMatchesCurrentPlate && Boolean(plateAccountInfo?.hasActivePackage);
  const hasActiveReservation = accountMatchesCurrentPlate && Boolean(plateAccountInfo?.hasActiveReservation);
  // Check-in kind determines photo rules:
  //  - 'package'/'reservation': scan only (plate/QR) for identification — no photo required.
  //  - 'standard' (guest / regular user): plate photo + portrait both required.
  const checkInKind: 'package' | 'reservation' | 'standard' = hasActivePackage
    ? 'package'
    : hasActiveReservation
      ? 'reservation'
      : 'standard';
  useEffect(() => {
    // Fetch free slots for package (floating assignment) and standard/walk-in (BE requires slot when available)
    if (checkInKind === 'reservation' || !buildingId) {
      setFreeSlots([]);
      setSelectedSlotId('');
      setSelectedFloorId('');
      return;
    }
    let cancelled = false;
    staffApi
      .freeSlots(buildingId)
      .then((res) => {
        if (!cancelled) {
          setFreeSlots((res as { data?: { items?: typeof freeSlots } })?.data?.items ?? []);
          setSelectedSlotId('');
          setSelectedFloorId('');
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [checkInKind, buildingId]);

  // Apply recognized plate (AI/QR) → lookup runs automatically via effect on plateNumber.
  const applyPlate = (plate: string, brand: string | null = null) => {
    const clean = normalizePlate(plate) || plate.trim().toUpperCase();
    setPlateNumber(clean);
    if (brand) setVehicleBrand(brand);
  };

  // Called right before each camera scan — aborts any in-flight lookupPlate fetch at the
  // network level (synchronously, before React re-renders), then clears all plate/account state.
  const handlePlateScanStart = () => {
    lookupAbortRef.current?.abort();
    lookupAbortRef.current = null;
    setPlateNumber('');
    setVehicleBrand(null);
    setPlateImage(null);
    setPlateAccountInfo(null);
    setPlateInfoLoading(false);
  };

  // Plate camera: always save the captured image; only apply plate number if AI read it.
  // Do NOT auto-advance step — wait for lookup to determine kind (package/reservation/standard).
  const handlePlateDetected = ({ plateNumber: plate, brand, plateImage: img }: PlateScanResult) => {
    setPlateImage(img);
    if (plate) applyPlate(plate, brand);
    // If scan returns empty, plate/account were already cleared by handlePlateScanStart.
  };

  // Leave step 1 → Portrait capture step. ALL check-in kinds require a portrait photo
  // (for identity verification at exit). Plate photo is additionally required for guest /
  // standard users (package/reservation use scan for identification so plate is optional).
  const proceedFromIdentify = () => {
    setStep(2);
  };

  // Step 2: capture portrait from portrait camera → save image → advance to Confirm.
  const capturePortraitAndNext = () => {
    const img = portraitCamRef.current?.capture() ?? null;
    if (!img) {
      setOpMessage({ type: 'err', text: 'Portrait camera not ready. Please try again.' });
      return;
    }
    setPortraitImage(img);
    setOpMessage(null);
    setStep(3);
  };

  // Camera 3: scan QR (plate token PLT- or account ID) → open popup. The portrait photo
  // is captured by the portrait camera (Camera 1) separately at check-in.
  const handleResolveIdQr = async (code: string) => {
    try {
      const res = await staffApi.resolveQr(code);
      const data = (res as {
        data?: {
          kind: 'plate' | 'user';
          plate?: { plateNumber: string; vehicleType?: string; brand?: string | null } | null;
          user?: { id: string; fullName: string; email: string } | null;
        };
      })?.data;
      if (!data) {
        setOpMessage({ type: 'err', text: 'QR code not recognized.' });
        return;
      }
      if (data.kind === 'plate' && data.plate?.plateNumber) {
        handlePlateScanStart(); // clear stale plate/account state before applying new QR result
        if (data.plate.vehicleType === 'motorcycle') setVehicleType('motorcycle');
        else if (data.plate.vehicleType) setVehicleType('car');
        applyPlate(data.plate.plateNumber, data.plate.brand ?? null);
        // Capture the QR camera's current frame as the plate image — the camera is already
        // pointed at the vehicle, so this frame serves as the plate photo for standard check-in.
        const qrFrame = qrCamRef.current?.capture() ?? null;
        if (qrFrame) setPlateImage(qrFrame);
        // Switch to plate camera for visual confirmation and re-capture if staff wants.
        setIdentifyMode('plate');
        setOpMessage({
          type: 'ok',
          text: `Biển số ${data.plate.plateNumber} đã được nhận từ QR.${qrFrame ? ' Có thể chụp lại bằng camera biển số nếu muốn.' : ' Vui lòng chụp ảnh biển số để tiếp tục.'}`,
        });
      } else if (data.kind === 'user' && data.user) {
        // Open full user info popup + pre-switch to plate camera so it's ready when popup closes.
        setScannedUser({ ...data.user });
        setIdentifyMode('plate');
      } else {
        setOpMessage({ type: 'err', text: 'QR code does not match any account or vehicle.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'QR code lookup error.' });
    }
  };

  const resetForm = () => {
    setPlateNumber('');
    setVehicleBrand(null);
    setPlateImage(null);
    setPortraitImage(null);
    setPlateAccountInfo(null);
    setPlateInfoLoading(false);
    setFreeSlots([]);
    setSelectedSlotId('');
    setSelectedFloorId('');
    setScannedUser(null);
    setStep(1);
    setIdentifyMode('plate');
  };

  const onCheckIn = async () => {
    setOpMessage(null);
    // Package: must select a slot (floating model — slot not fixed at purchase).
    if (hasActivePackage && !selectedSlotId) {
      setOpMessage({ type: 'err', text: 'Xe có gói dài hạn — vui lòng chọn ô đỗ trước khi check-in.' });
      return;
    }
    // Walk-in: slot required when building has available slots (BE enforces this).
    if (checkInKind === 'standard' && freeSlots.length > 0 && !selectedSlotId) {
      setOpMessage({ type: 'err', text: 'Vui lòng chọn ô đỗ cho khách vãng lai.' });
      return;
    }
    setLoading(true);
    const currentPlate = normalizePlate(plateNumber) || plateNumber.trim().toUpperCase();
    // Ensure BOTH images are captured at check-in: use the already-scanned frame
    // if present, otherwise grab a fresh frame from the live camera. This way the
    // checkout staff always sees a full plate + portrait set.
    const plateImg = plateImage ?? plateCamRef.current?.capture() ?? null;
    // The portrait photo comes from the separate portrait camera (Camera 1).
    const portraitImg = portraitImage ?? portraitCamRef.current?.capture() ?? null;
    try {
      await staffApi.checkIn({
        plateNumber: currentPlate,
        vehicleType: vehicleType === 'motorcycle' ? 'motorcycle' : 'car',
        building: buildingId || undefined,
        gate: entryGate?._id || undefined,
        vehicleBrand: vehicleBrand || undefined,
        plateImage: plateImg,
        portraitImage: portraitImg,
        slot: selectedSlotId || undefined,
      });
      setOpMessage({ type: 'ok', text: `Parking session created for plate ${currentPlate}.` });
      resetForm();
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-in failed' });
    } finally {
      setLoading(false);
    }
  };

  // Staff reject check-in (e.g. vehicle type does not match registration) → BE notifies the customer.
  const onReject = async () => {
    const plate = normalizePlate(plateNumber) || plateNumber.trim().toUpperCase();
    const stage: OperationMode = 'check-in';
    if (!plate || !rejectReason.trim()) return;
    try {
      const res = await staffApi.reject({
        plateNumber: plate,
        stage,
        reason: rejectReason.trim(),
        building: buildingId || undefined,
      });
      const notified = (res as { data?: { notified?: boolean } })?.data?.notified;
      setOpMessage({
        type: 'ok',
        text: `Rejected entry for plate ${plate}.${notified ? ' The customer has been notified.' : ' (The plate has no account, so no notification was sent.)'}`,
      });
      setRejectOpen(false);
      setRejectReason('');
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Rejection failed' });
    }
  };

  // Does the detected/selected vehicle type differ from the registered one?
  const vehicleTypeMismatch = Boolean(
    plateAccountInfo?.registeredVehicleType && plateAccountInfo.registeredVehicleType !== vehicleType
  );

  // Unique floors from free slots (to drive the floor picker)
  const uniqueFloors = useMemo(() => {
    const seen = new Set<string>();
    const floors: Array<{ _id: string; name?: string; code?: string }> = [];
    for (const s of freeSlots) {
      if (s.floor && !seen.has(s.floor._id)) {
        seen.add(s.floor._id);
        floors.push(s.floor);
      }
    }
    return floors;
  }, [freeSlots]);

  // Slots filtered by selected floor (all slots when only 1 floor or no floor selected)
  const slotsForFloor = useMemo(
    () =>
      uniqueFloors.length >= 2 && selectedFloorId
        ? freeSlots.filter((s) => s.floor?._id === selectedFloorId)
        : freeSlots,
    [freeSlots, selectedFloorId, uniqueFloors]
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Operations shift</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Check in vehicle</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {building ? `${building.code} · ${building.name}` : 'No building selected'}
            </p>
          </div>
          <Link
            to="/staff/parked"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80 lg:self-auto"
          >
            <Car size={14} />Parked vehicles</Link>
        </div>
      </section>

      {/* Check-in — Sequential mode (1 camera/step) or Multi-camera (all open at once) */}
      <section className={`mx-auto w-full space-y-4 ${multiCamMode ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Check-in vehicle</CardTitle>
              <div className="flex items-center gap-2">
                {/* Mode toggle */}
                <div className="flex rounded-lg border border-border bg-muted p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMultiCamMode(false)}
                    className={`rounded-md px-2.5 py-1 transition ${!multiCamMode ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Sequential
                  </button>
                  <button
                    type="button"
                    onClick={() => setMultiCamMode(true)}
                    className={`rounded-md px-2.5 py-1 transition ${multiCamMode ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Multi-camera
                  </button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => { setCameraSettingsOpen(true); void requestAndRefresh(); }}
                  className="gap-1.5 text-xs"
                  title="Assign cameras to each role (when multiple cameras available)"
                >
                  <Settings size={13} /> Camera settings
                </Button>
              </div>
            </div>
            {/* Step indicator (sequential mode only) */}
            {!multiCamMode && (
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold">
              {[
                { n: 1, label: 'Identify vehicle' },
                { n: 2, label: 'Capture portrait' },
                { n: 3, label: 'Confirm' },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${step >= s.n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{s.n}</span>
                  <span className={step === s.n ? 'text-foreground' : 'text-muted-foreground'}>{s.label}</span>
                  {i < 2 && <span className="mx-1 hidden h-px w-5 bg-border sm:inline-block" />}
                </div>
              ))}
            </div>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {/* ══ MULTI-CAMERA MODE — all 3 open at once, simultaneous capture ══ */}
            {multiCamMode && (
              <div className="space-y-5">
                <div className="grid gap-3 lg:grid-cols-3">
                  <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} onScanStart={handlePlateScanStart} busy={loading} deviceId={assignment.plate} />
                  <LivePortraitCamera ref={portraitCamRef} deviceId={assignment.portrait} />
                  <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} paused={plateNumber.trim().length >= 7 || !!scannedUser} />
                </div>

                {distinctDeviceCount < 2 && (
                  <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
                    Currently sharing 1 webcam for all 3 roles so the frames look identical. Connect additional cameras and go to "Camera settings" to assign each one separately for simultaneous plate and portrait capture.
                  </p>
                )}

                {/* Plate number + account */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plate number</label>
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    onBlur={(e) => { const n = normalizePlate(e.target.value); if (n) setPlateNumber(n); }}
                    placeholder="59G2-038.80"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !(!plateNumber.trim() || loading || !!buildingSupportWarning || (hasActivePackage && !selectedSlotId))) onCheckIn(); }}
                  />
                  {vehicleBrand && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                      <Car size={11} /> Brand: {vehicleBrand}
                    </span>
                  )}
                  {plateNumber.trim().length >= 7 && !plateInfoLoading && accountMatchesCurrentPlate && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                      Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && !plateInfoLoading && accountMatchesCurrentPlate && !plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      <strong className="text-foreground">Guest</strong> (no account).
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && !plateInfoLoading && checkInKind === 'package' && (
                    <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      🅿️ Vehicle has a long-term package{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — select an empty slot below.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && !plateInfoLoading && checkInKind === 'reservation' && (
                    <div className="mt-1 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                      📅 Vehicle has a reservation{plateAccountInfo?.activeReservation?.code ? ` (code ${plateAccountInfo.activeReservation.code})` : ''}.
                    </div>
                  )}
                </div>

                {/* Vehicle type + warnings */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vehicle type</label>
                  <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                    <button type="button" disabled={!allowedTypes.includes('CAR')} onClick={() => setVehicleType('car')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'car' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}>
                      <Car size={13} /> Car
                    </button>
                    <button type="button" disabled={!allowedTypes.includes('MOTORCYCLE')} onClick={() => setVehicleType('motorcycle')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}>
                      <Bike size={13} /> Motorcycle
                    </button>
                  </div>
                  {plateTypeWarning && <p className="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> {plateTypeWarning}</p>}
                  {buildingSupportWarning && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertCircle size={11} /> {buildingSupportWarning}</p>}
                  {vehicleTypeMismatch && (
                    <p className="text-[11px] text-rose-300 flex items-center gap-1">
                      <AlertCircle size={12} /> Vehicle type does not match registration (registered: <strong>{plateAccountInfo?.registeredVehicleType === 'car' ? 'Car' : 'Motorcycle'}</strong>).
                    </p>
                  )}
                </div>

                {/* Slot + floor selection: required for package (floating) and walk-in */}
                {!plateInfoLoading && (hasActivePackage || (checkInKind === 'standard' && freeSlots.length > 0)) && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                    <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {hasActivePackage
                        ? `Gói dài hạn${plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — chọn tầng và ô đỗ:`
                        : 'Chọn tầng và ô đỗ cho khách vãng lai:'}
                    </p>
                    {uniqueFloors.length >= 2 && (
                      <div>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200/60">Tầng:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueFloors.map((f) => (
                            <button
                              key={f._id}
                              type="button"
                              onClick={() => { setSelectedFloorId(f._id); setSelectedSlotId(''); }}
                              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                selectedFloorId === f._id
                                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                              }`}
                            >
                              {f.name || f.code}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      disabled={uniqueFloors.length >= 2 && !selectedFloorId}
                      className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-amber-400/60 disabled:opacity-40"
                    >
                      <option value="">
                        {uniqueFloors.length >= 2 && !selectedFloorId ? '-- Chọn tầng trước --' : '-- Chọn ô đỗ --'}
                      </option>
                      {slotsForFloor.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.code}{uniqueFloors.length < 2 && (s.floor?.name || s.floor?.code) ? ` · ${s.floor?.name || s.floor?.code}` : ''}
                        </option>
                      ))}
                    </select>
                    {freeSlots.length === 0 && <p className="text-[11px] text-rose-300">Không có ô trống.</p>}
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">Ảnh biển số và chân dung được chụp đồng thời từ tất cả camera khi nhấn Check-in.</p>

                <div className="flex gap-2">
                  <Button
                    onClick={onCheckIn}
                    disabled={!plateNumber.trim() || loading || !!buildingSupportWarning || (hasActivePackage && !selectedSlotId) || (checkInKind === 'standard' && freeSlots.length > 0 && !selectedSlotId)}
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                  >
                    <ScanLine size={16} /> Check-in (entry)
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setRejectOpen(true)} disabled={loading || !plateNumber.trim()}
                    className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 1 — Identify vehicle ── */}
            {!multiCamMode && step === 1 && (
              <div className="space-y-4">
                <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                  <button
                    type="button"
                    onClick={() => setIdentifyMode('plate')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'plate' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <ScanLine size={13} /> Scan plate (AI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifyMode('qr')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'qr' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <QrCode size={13} /> Scan QR
                  </button>
                </div>

                {/* Always mount both cameras — switching via CSS avoids the camera restart
                    race-condition where the browser hasn't released one device before
                    the other component calls getUserMedia for the same device. */}
                <div className={identifyMode !== 'plate' ? 'hidden' : ''}>
                  <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} onScanStart={handlePlateScanStart} busy={loading} deviceId={assignment.plate} />
                </div>
                <div className={identifyMode !== 'qr' ? 'hidden' : ''}>
                  <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} paused={identifyMode !== 'qr'} />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plate number (or enter manually)</label>
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    onBlur={(e) => {
                      const n = normalizePlate(e.target.value);
                      if (n) setPlateNumber(n);
                    }}
                    placeholder="59G2-038.80"
                    onKeyDown={(e) => { if (e.key === 'Enter' && plateNumber.trim().length >= 7 && !(checkInKind === 'standard' && !plateImage)) proceedFromIdentify(); }}
                  />
                  {vehicleBrand && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                      <Car size={11} /> Brand: {vehicleBrand}
                    </span>
                  )}
                  {plateNumber.trim().length >= 7 && !plateInfoLoading && accountMatchesCurrentPlate && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-emerald-400">
                        Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                      </p>
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && !plateInfoLoading && accountMatchesCurrentPlate && !plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-xs text-amber-300">
                        Plate <strong className="text-foreground">{plateNumber.toUpperCase()}</strong> — <strong>Guest</strong> (no account).
                      </p>
                    </div>
                  )}
                  {/* Check-in kind badge */}
                  {plateNumber.trim().length >= 7 && !plateInfoLoading && checkInKind === 'package' && (
                    <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      🅿️ Vehicle has a <strong>long-term package</strong>{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — next step: capture portrait &amp; select empty slot.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && !plateInfoLoading && checkInKind === 'reservation' && (
                    <div className="mt-1 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                      📅 Vehicle has a <strong>reservation</strong>{plateAccountInfo?.activeReservation?.code ? ` (code ${plateAccountInfo.activeReservation.code})` : ''} — next step: capture portrait to confirm.
                    </div>
                  )}
                  {/* Only show the plate-photo instruction when in plate mode — never as a red blocker */}
                  {plateNumber.trim().length >= 7 && identifyMode === 'plate' && checkInKind === 'standard' && !plateImage && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
                      Nhấn <strong>"Chụp &amp; nhận dạng"</strong> ở camera biển số để chụp ảnh (bắt buộc cho khách vãng lai).
                    </div>
                  )}
                </div>

                <Button
                  onClick={proceedFromIdentify}
                  disabled={plateNumber.trim().length < 7 || !!buildingSupportWarning || (checkInKind === 'standard' && !plateImage)}
                  className="w-full h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                >
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            )}

            {/* ── STEP 2 — Capture portrait ── */}
            {!multiCamMode && step === 2 && (
              <div className="space-y-4">
                <LivePortraitCamera ref={portraitCamRef} deviceId={assignment.portrait} />
                {portraitImage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400">
                    <UserSquare size={14} /> Portrait captured — you can retake if needed.
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 gap-1">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button onClick={capturePortraitAndNext} className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110">
                    <UserSquare size={16} /> {portraitImage ? 'Retake & continue' : 'Capture portrait & continue'}
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3 — Confirm & check-in ── */}
            {!multiCamMode && step === 3 && (
              <div className="space-y-5">
                {/* Check-in kind banner */}
                {!plateInfoLoading && checkInKind === 'package' && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                    🅿️ Vehicle has a long-term package{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — select an empty slot below then check-in.
                  </div>
                )}
                {!plateInfoLoading && checkInKind === 'reservation' && (
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                    📅 Vehicle has a reservation{plateAccountInfo?.activeReservation?.code ? ` (code ${plateAccountInfo.activeReservation.code})` : ''} — confirm to allow entry.
                  </div>
                )}

                {/* Captured photos — portrait required for all; plate required for guest/standard */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Plate photo{checkInKind !== 'standard' ? ' (optional)' : ''}
                    </p>
                    <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
                      {plateImage ? (
                        <img src={plateImage} alt="Plate photo" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Portrait photo</p>
                    <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
                      {portraitImage ? (
                        <img src={portraitImage} alt="Portrait photo" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Plate number + account */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plate number</label>
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    onBlur={(e) => {
                      const n = normalizePlate(e.target.value);
                      if (n) setPlateNumber(n);
                    }}
                    placeholder="59G2-038.80"
                  />
                  {vehicleBrand && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                      <Car size={11} /> Brand: {vehicleBrand}
                    </span>
                  )}
                  {plateNumber.trim().length >= 7 && !plateInfoLoading && accountMatchesCurrentPlate && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-emerald-400">
                        Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                      </p>
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && !plateInfoLoading && accountMatchesCurrentPlate && !plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-xs text-amber-300">
                        Plate <strong className="text-foreground">{plateNumber.toUpperCase()}</strong> — <strong>Guest</strong> (no account).
                      </p>
                    </div>
                  )}
                </div>

                {/* Vehicle type + warnings */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Vehicle type</label>
                  <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                    <button
                      type="button"
                      disabled={!allowedTypes.includes('CAR')}
                      onClick={() => setVehicleType('car')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'car' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
                    >
                      <Car size={13} /> Car
                    </button>
                    <button
                      type="button"
                      disabled={!allowedTypes.includes('MOTORCYCLE')}
                      onClick={() => setVehicleType('motorcycle')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
                    >
                      <Bike size={13} /> Motorcycle
                    </button>
                  </div>
                  {plateTypeWarning && <p className="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> {plateTypeWarning}</p>}
                  {buildingSupportWarning && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertCircle size={11} /> {buildingSupportWarning}</p>}
                  {vehicleTypeMismatch && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[11px] text-rose-300 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1">
                        <AlertCircle size={12} /> Vehicle type does not match registration (registered: <strong>{plateAccountInfo?.registeredVehicleType === 'car' ? 'Car' : 'Motorcycle'}</strong>).
                      </span>
                      <button type="button" onClick={() => setRejectOpen(true)} className="shrink-0 rounded-md bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-400">
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Slot + floor selection: required for package and walk-in */}
                {!plateInfoLoading && (hasActivePackage || (checkInKind === 'standard' && freeSlots.length > 0)) && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
                    <p className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {hasActivePackage
                        ? `Gói dài hạn${plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''}${plateAccountInfo?.activePackage?.maxHoursPerDay ? ` · ${plateAccountInfo.activePackage.maxHoursPerDay}h/ngày` : ''} — chọn tầng và ô đỗ:`
                        : 'Chọn tầng và ô đỗ cho khách vãng lai:'}
                    </p>
                    {uniqueFloors.length >= 2 && (
                      <div>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200/60">Tầng:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueFloors.map((f) => (
                            <button
                              key={f._id}
                              type="button"
                              onClick={() => { setSelectedFloorId(f._id); setSelectedSlotId(''); }}
                              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                                selectedFloorId === f._id
                                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                              }`}
                            >
                              {f.name || f.code}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <select
                      value={selectedSlotId}
                      onChange={(e) => setSelectedSlotId(e.target.value)}
                      disabled={uniqueFloors.length >= 2 && !selectedFloorId}
                      className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-amber-400/60 disabled:opacity-40"
                    >
                      <option value="">
                        {uniqueFloors.length >= 2 && !selectedFloorId ? '-- Chọn tầng trước --' : '-- Chọn ô đỗ --'}
                      </option>
                      {slotsForFloor.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.code}{uniqueFloors.length < 2 && (s.floor?.name || s.floor?.code) ? ` · ${s.floor?.name || s.floor?.code}` : ''}
                        </option>
                      ))}
                    </select>
                    {freeSlots.length === 0 && (
                      <p className="text-[11px] text-rose-300">Không có ô trống trong tòa nhà này.</p>
                    )}
                  </div>
                )}

                {/* Missing photo warning: portrait required for all; plate required for guest/standard */}
                {(!portraitImage || (checkInKind === 'standard' && !plateImage)) && (
                  <p className="text-[11px] text-rose-300 flex items-center gap-1">
                    <AlertCircle size={12} /> <strong>Portrait photo</strong> required
                    {checkInKind === 'standard' ? <> and <strong>plate photo</strong></> : null} before check-in (go back to the previous step to capture).
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-11 gap-1">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    onClick={onCheckIn}
                    disabled={
                      !plateNumber.trim() || loading || !!buildingSupportWarning || !portraitImage ||
                      (hasActivePackage && !selectedSlotId) ||
                      (checkInKind === 'standard' && !plateImage) ||
                      (checkInKind === 'standard' && freeSlots.length > 0 && !selectedSlotId)
                    }
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                  >
                    <ScanLine size={16} /> Check-in (vào)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRejectOpen(true)}
                    disabled={loading || !plateNumber.trim()}
                    className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Operation feedback */}
            {opMessage && (
              <div className={`rounded-xl border p-4 text-sm ${opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
                {opMessage.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note: packages & reservations are auto-detected on scan — no manual code entry needed */}
        <div className="rounded-xl border border-border bg-card/50 p-4 text-xs text-muted-foreground">
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
            <ScanLine size={13} className="text-primary" /> Packages &amp; reservations auto-detected
          </p>
          Vehicles with a <strong>long-term package</strong> or <strong>prior reservation</strong> are automatically matched as soon as the plate / QR is scanned in step 1 — no manual code entry needed.
          Payment collection &amp; vehicle release are handled by exit-gate staff in the{' '}
          <Link to="/staff/parked" className="font-semibold text-primary hover:underline">"Parked vehicles"</Link> tab.
        </div>
      </section>

      {/* Camera settings — assign physical devices to each role */}
      {cameraSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Devices</p>
                <h3 className="text-xl font-semibold text-foreground">Camera settings</h3>
              </div>
              <button onClick={() => setCameraSettingsOpen(false)} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>

            <p className="mb-4 text-xs text-muted-foreground">
              When multiple cameras are available (plate / portrait / QR), assign each role to a separate device
              so they can all open simultaneously and capture the correct image. On a single-webcam machine all roles share the same device.
            </p>

            <div className="space-y-3">
              {([
                { role: 'plate' as CameraRole, label: 'Camera 1 · Plate' },
                { role: 'qr' as CameraRole, label: 'Camera 2 · QR' },
                { role: 'portrait' as CameraRole, label: 'Camera 3 · Portrait' },
              ]).map(({ role, label }) => (
                <div key={role} className="grid gap-1.5">
                  <label className="text-xs font-semibold text-foreground">{label}</label>
                  <select
                    value={assignment[role] ?? ''}
                    onChange={(e) => assign(role, e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
                  >
                    <option value="">— Auto (default) —</option>
                    {devices.map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {devices.length === 0 && (
              <p className="mt-3 text-[11px] text-amber-400">
                No devices found — press "Refresh" and grant camera permission in the browser.
              </p>
            )}

            <div className="mt-5 flex justify-between gap-2">
              <Button type="button" variant="secondary" onClick={() => void requestAndRefresh()} className="gap-1.5 text-xs">
                <Settings size={13} /> Refresh list
              </Button>
              <Button onClick={() => setCameraSettingsOpen(false)} className="bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 text-xs">
                Done
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User QR info popup */}
      {scannedUser && (
        <UserAccountInfoModal user={scannedUser} onClose={() => setScannedUser(null)} />
      )}

      {/* Reject check-in */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Reject entry</p>
                <h3 className="text-xl font-semibold text-foreground">Rejection reason</h3>
              </div>
              <button onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Plate <strong className="text-foreground font-mono">{normalizePlate(plateNumber) || plateNumber || '—'}</strong>. The system will send a notification with the reason to the customer's account (if the plate is registered).</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Registered a motorcycle but it is actually a car; vehicle info does not match..."
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/50"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-xs">Cancel</Button>
              <Button onClick={onReject} disabled={!rejectReason.trim()} className="bg-rose-500 text-white hover:bg-rose-400 text-xs disabled:opacity-60">Confirm rejection</Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
