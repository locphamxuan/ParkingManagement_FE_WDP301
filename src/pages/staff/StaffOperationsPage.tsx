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
import { LivePlateCamera } from '@/components/staff/LivePlateCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import { normalizePlate } from '@/utils/plate';
import { useStaffOperations, usageLabel } from '@/hooks/staff/useStaffOperations';
import { MultiCamCheckIn } from '@/components/staff/operations/MultiCamCheckIn';
import { CameraSettingsModal } from '@/components/staff/operations/CameraSettingsModal';
import { RejectCheckInModal } from '@/components/staff/operations/RejectCheckInModal';
import { UserQrInfoModal } from '@/components/staff/operations/UserQrInfoModal';

export function StaffOperationsPage() {
  const ops = useStaffOperations();
  const {
    buildingId, building,
    loading, plateNumber, setPlateNumber, vehicleBrand, vehicleType, setVehicleType,
    opMessage, plateImage, portraitImage,
    plateCamRef, qrCamRef, portraitCamRef,
    assignment, requestAndRefresh,
    setCameraSettingsOpen, multiCamMode, setMultiCamMode,
    step, setStep, identifyMode, setIdentifyMode,
    plateAccountInfo, freeSlots, selectedSlotId, setSelectedSlotId, selectedZoneId, setSelectedZoneId,
    availableZones, setRejectOpen,
    slotUsageType, selectedZone, zoneUsageBlocked, zoneUsageFallback, hasExactZoneFree,
    slotPoolState, slotSelectionBlocked,
    allowedTypes, plateTypeWarning, buildingSupportWarning,
    hasActivePackage, checkInKind, needsSlotSelection,
    handlePlateDetected, proceedFromIdentify, capturePortraitAndNext,
    handleResolveIdQr, onCheckIn, vehicleTypeMismatch,
  } = ops;


  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Operating shift</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Vehicle check-in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {building ? `${building.code} · ${building.name}` : 'No building selected'}
            </p>
          </div>
          <Link
            to="/staff/parked"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80 lg:self-auto"
          >
            <Car size={14} /> Parked vehicles
          </Link>
        </div>
      </section>

      {/* Check-in — chế độ Tuần tự (1 camera/bước) hoặc Nhiều camera (mở cùng lúc) */}
      <section className={`mx-auto w-full space-y-4 ${multiCamMode ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Vehicle check-in</CardTitle>
              <div className="flex items-center gap-2">
                {/* Toggle chế độ */}
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
                  title="Assign a camera to each role (when multiple cameras)"
                >
                  <Settings size={13} /> Camera settings
                </Button>
              </div>
            </div>
            {/* Step indicator (chỉ ở chế độ tuần tự) */}
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
            {/* ══ CHẾ ĐỘ NHIỀU CAMERA — mở cả 3 cùng lúc, chụp đồng thời ══ */}
            <MultiCamCheckIn ops={ops} />

            {/* ── BƯỚC 1 — Nhận diện xe ── */}
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

                {identifyMode === 'plate' ? (
                  <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} busy={loading} deviceId={assignment.plate} buildingId={buildingId} />
                ) : (
                  <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} />
                )}

                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">License plate (or enter manually)</label>
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
                  {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-emerald-400">
                        Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                      </p>
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-xs text-amber-300">
                        Plate <strong className="text-foreground">{plateNumber.toUpperCase()}</strong> — <strong>Walk-in guest</strong> (no account).
                      </p>
                    </div>
                  )}
                  {/* Badge loại check-in đã nhận diện */}
                  {plateNumber.trim().length >= 7 && checkInKind === 'package' && (
                    <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      🅿️ Vehicle has a <strong>long-term package</strong>{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''}  — next: capture portrait &amp; pick a free slot.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'reservation' && (
                    <div className="mt-1 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                      📅 Vehicle has a <strong>reservation</strong>{plateAccountInfo?.activeReservation?.code ? ` (code ${plateAccountInfo.activeReservation.code})` : ''}  — next: capture portrait to confirm.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'standard' && !plateImage && (
                    <div className="mt-1 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-[11px] text-rose-300">
                      Requires a <strong>plate photo</strong>: tap “Capture &amp; recognize” on the plate camera (required for walk-in guests / regular users).
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

            {/* ── BƯỚC 2 — Chụp chân dung ── */}
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

            {/* ── BƯỚC 3 — Xác nhận & check-in ── */}
            {!multiCamMode && step === 3 && (
              <div className="space-y-5">
                {/* Banner loại check-in đã nhận diện */}
                {checkInKind === 'package' && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                    🅿️ Vehicle has a long-term package{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — pick a free slot below then check in.
                  </div>
                )}
                {checkInKind === 'reservation' && (
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                    📅 Vehicle has a reservation{plateAccountInfo?.activeReservation?.code ? ` (code ${plateAccountInfo.activeReservation.code})` : ''} — confirm to admit.
                  </div>
                )}

                {/* Ảnh đã chụp — chân dung bắt buộc cho mọi loại; biển bắt buộc với vãng lai/user thường */}
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

                {/* Biển số + tài khoản */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">License plate</label>
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
                  {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-emerald-400">
                        Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                      </p>
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-xs text-amber-300">
                        Plate <strong className="text-foreground">{plateNumber.toUpperCase()}</strong> — <strong>Walk-in guest</strong> (no account).
                      </p>
                    </div>
                  )}
                </div>

                {/* Loại xe + cảnh báo */}
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

                {/* Chọn ô đỗ: bắt buộc với gói dài hạn và check-in thường (khách vãng lai / user) */}
                {needsSlotSelection && (
                  <div className={`rounded-xl border p-3 space-y-3 ${hasActivePackage ? 'border-amber-500/30 bg-amber-500/10' : 'border-sky-500/30 bg-sky-500/10'}`}>
                    <p className={`text-[11px] font-bold flex items-center gap-1 ${hasActivePackage ? 'text-amber-300' : 'text-sky-300'}`}>
                      <AlertCircle size={12} />
                      {hasActivePackage
                        ? `Vehicle has a long-term package${plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''}${plateAccountInfo?.activePackage?.maxHoursPerDay ? ` · free ${plateAccountInfo.activePackage.maxHoursPerDay}h/day` : ''} — pick a zone & free slot:`
                        : 'Pick a zone & slot for the guest (required if the building has slots):'}
                      <span className="ml-1 inline-flex items-center rounded-full border border-white/15 bg-slate-950/40 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-300">
                        {usageLabel(slotUsageType)}
                      </span>
                    </p>

                    {freeSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Zone</label>
                          <select
                            value={selectedZoneId}
                            onChange={(e) => {
                              setSelectedZoneId(e.target.value);
                              setSelectedSlotId('');
                            }}
                            className={`h-9 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-xs font-semibold text-white outline-none ${hasActivePackage ? 'focus:border-amber-400/60' : 'focus:border-sky-400/60'}`}
                          >
                            <option value="">-- Zone --</option>
                            {availableZones.map((z) => (
                              <option key={z._id} value={z._id}>
                                Zone {z.code}{z.usageType ? ` · ${usageLabel(z.usageType)}` : ''} ({z.count} free){z.usageType && z.usageType !== slotUsageType ? ' — fallback' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Slot</label>
                          <select
                            value={selectedSlotId}
                            onChange={(e) => setSelectedSlotId(e.target.value)}
                            disabled={!selectedZoneId}
                            className={`h-9 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-xs font-semibold text-white outline-none ${hasActivePackage ? 'focus:border-amber-400/60' : 'focus:border-sky-400/60'} disabled:opacity-50`}
                          >
                            <option value="">-- Slot --</option>
                            {freeSlots
                              .filter((s) => s.zone && typeof s.zone === 'object' && s.zone._id === selectedZoneId)
                              .map((s) => (
                                <option key={s._id} value={s._id}>
                                  {s.code}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    ) : slotPoolState === 'capacity' ? (
                      <p className="text-[11px] text-slate-400">This building has no fixed slots — vehicles park by shared capacity.</p>
                    ) : slotPoolState === 'full' ? (
                      <p className="text-[11px] text-rose-300 flex items-center gap-1">
                        <AlertCircle size={12} /> The building is full — no free slots to assign.
                      </p>
                    ) : (
                      <p className="text-[11px] text-rose-300 flex items-center gap-1">
                        <AlertCircle size={12} /> No <strong>{usageLabel(slotUsageType)}</strong> slots free right now — remaining slots belong to other customer types, so this vehicle cannot check in.
                      </p>
                    )}

                    {/* Cảnh báo đối tượng của zone đang chọn */}
                    {zoneUsageBlocked && (
                      <p className="text-[11px] text-rose-300 flex items-center gap-1">
                        <AlertCircle size={12} /> This zone ({usageLabel(selectedZone?.usageType)}) is not allowed for a <strong>{usageLabel(slotUsageType)}</strong> vehicle. Pick a compatible zone.
                      </p>
                    )}
                    {!zoneUsageBlocked && zoneUsageFallback && (
                      <p className="text-[11px] text-amber-300 flex items-center gap-1">
                        <AlertCircle size={12} /> This is a <strong>{usageLabel(selectedZone?.usageType)}</strong> zone used as fallback for a {usageLabel(slotUsageType)} vehicle{hasExactZoneFree ? ` — ${usageLabel(slotUsageType)} zones are still free, prefer those.` : '.'}
                      </p>
                    )}
                  </div>
                )}

                {/* Nhắc thiếu ảnh: chân dung bắt buộc mọi loại; biển bắt buộc với vãng lai/user thường */}
                {(!portraitImage || (checkInKind === 'standard' && !plateImage)) && (
                  <p className="text-[11px] text-rose-300 flex items-center gap-1">
                    <AlertCircle size={12} /> Requires a <strong>portrait photo</strong>
                    {checkInKind === 'standard' ? <> and a <strong>plate photo</strong></> : null} to check in (go back to capture).
                  </p>
                )}

                {/* Nút hành động */}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-11 gap-1">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    onClick={onCheckIn}
                    disabled={!plateNumber.trim() || loading || !!buildingSupportWarning || zoneUsageBlocked || slotSelectionBlocked || !portraitImage || (hasActivePackage && !selectedSlotId) || (checkInKind === 'standard' && !plateImage) || (checkInKind === 'standard' && freeSlots.length > 0 && !selectedSlotId)}
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                  >
                    <ScanLine size={16} /> Check-in (entry)
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

            {/* Phản hồi thao tác */}
            {opMessage && (
              <div className={`rounded-xl border p-4 text-sm ${opMessage.type === 'ok' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
                {opMessage.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ghi chú: gói & đặt chỗ tự nhận diện khi quét — không cần nhập mã thủ công */}
        <div className="rounded-xl border border-border bg-card/50 p-4 text-xs text-muted-foreground">
          <p className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
            <ScanLine size={13} className="text-primary" /> Packages &amp; reservations auto-detected
          </p>
          Vehicles with a <strong>package</strong> or a <strong>prior reservation</strong> are auto-matched as soon as the plate / QR is scanned in step 1 — no manual code entry needed.
          Fee collection &amp; vehicle exit are handled by the exit-gate staff in the{' '}
          <Link to="/staff/parked" className="font-semibold text-primary hover:underline">“Parked vehicles”</Link>.
        </div>
      </section>

      {/* Cài đặt camera — gán thiết bị vật lý cho từng vai trò */}
      <CameraSettingsModal ops={ops} />

      {/* Reject check-in */}
      <RejectCheckInModal ops={ops} />

      {/* Modal: Thông tin tài khoản user từ QR scan */}
      <UserQrInfoModal ops={ops} />

    </motion.div>
  );
}
