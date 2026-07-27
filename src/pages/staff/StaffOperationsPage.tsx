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
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
import { BarrierGateOverlay } from '@/components/staff/BarrierGateOverlay';

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
    allowedTypes, plateTypeWarning, buildingSupportWarning, barrierState,
    hasActivePackage, checkInKind, needsSlotSelection, isMotorcycle,
    handlePlateDetected, proceedFromIdentify, capturePortraitAndNext,
    handleResolveIdQr, onCheckIn, vehicleTypeMismatch,
  } = ops;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-5"
    >
      {/* Header Banner */}
      <section
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(224,242,254,0.7) 0%, rgba(255,255,255,0.75) 50%, rgba(219,234,254,0.5) 100%)',
          border: '1px solid rgba(14,165,233,0.18)',
          boxShadow: '0 4px 24px rgba(14,165,233,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                border: '1px solid rgba(14,165,233,0.22)',
                boxShadow: '0 4px 12px rgba(14,165,233,0.12)',
              }}>
              <ScanLine className="text-sky-600" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-500">Operating shift</p>
              <h2 className="text-lg font-extrabold text-slate-800 leading-tight">Vehicle Check-in</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {building ? `${building.code} · ${building.name}` : 'No building selected'}
              </p>
            </div>
          </div>
          <Link
            to="/staff/parked"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-white border border-sky-100 hover:bg-sky-50 hover:text-sky-700 px-4 text-xs font-bold text-slate-700 transition duration-200 shadow-sm"
          >
            <Car size={13} className="text-sky-500" /> Parked vehicles
          </Link>
        </div>
      </section>

      {/* Main Form Area */}
      <section className={`mx-auto w-full space-y-4 ${multiCamMode ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <div
          className="relative overflow-hidden rounded-3xl p-5 md:p-6"
          style={{
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid rgba(14,165,233,0.14)',
            boxShadow: '0 10px 30px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Top border line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />

          {/* Form Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-4 mb-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Check-in Process</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sequential scanning and verification</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Mode Toggle */}
              <div className="flex rounded-xl border border-sky-100 bg-sky-50/50 p-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setMultiCamMode(false)}
                  className={`rounded-lg px-3 py-1.5 transition-all duration-200 ${!multiCamMode ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Sequential
                </button>
                <button
                  type="button"
                  onClick={() => setMultiCamMode(true)}
                  className={`rounded-lg px-3 py-1.5 transition-all duration-200 ${multiCamMode ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Multi-camera
                </button>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => { setCameraSettingsOpen(true); void requestAndRefresh(); }}
                className="gap-1.5 text-xs h-8 rounded-lg bg-sky-50 border border-sky-100 text-sky-700 hover:bg-sky-100/70"
              >
                <Settings size={13} /> Camera settings
              </Button>
            </div>
          </div>

          {/* Step indicator (only in sequential mode) */}
          {!multiCamMode && (
            <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-2xl bg-sky-50/40 border border-sky-100/50 p-3 text-[11px] font-bold">
              {[
                { n: 1, label: 'Identify vehicle' },
                { n: 2, label: 'Capture portrait' },
                { n: 3, label: 'Confirm check-in' },
              ].map((s, i) => {
                const isActive = step === s.n;
                const isCompleted = step > s.n;
                return (
                  <div key={s.n} className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                          : isActive
                          ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/10 scale-105'
                          : 'bg-slate-200/70 text-slate-400'
                      }`}
                    >
                      {s.n}
                    </span>
                    <span className={isActive ? 'text-slate-800 font-extrabold' : 'text-slate-400'}>{s.label}</span>
                    {i < 2 && <span className="mx-1.5 hidden h-px w-6 bg-sky-200/50 sm:inline-block" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Content */}
          <div className="space-y-5">
            {/* ══ MULTI CAMERA MODE ══ */}
            <MultiCamCheckIn ops={ops} />

            {/* ── STEP 1: Identify vehicle ── */}
            {!multiCamMode && step === 1 && (
              <div className="space-y-4">
                <div className="flex gap-2 p-1 rounded-xl bg-slate-50 border border-sky-100">
                  <button
                    type="button"
                    onClick={() => setIdentifyMode('plate')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-extrabold transition-all duration-200 ${identifyMode === 'plate' ? 'bg-white text-sky-600 shadow-sm border border-sky-100/50' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <ScanLine size={13} className="text-sky-500" /> Scan plate (AI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifyMode('qr')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-extrabold transition-all duration-200 ${identifyMode === 'qr' ? 'bg-white text-sky-600 shadow-sm border border-sky-100/50' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <QrCode size={13} className="text-sky-500" /> Scan QR
                  </button>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-slate-50 shadow-inner">
                  {identifyMode === 'plate' ? (
                    <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} busy={loading} deviceId={assignment.plate} buildingId={buildingId} />
                  ) : (
                    <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} />
                  )}
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">License plate (or enter manually)</label>
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    onBlur={(e) => {
                      const n = normalizePlate(e.target.value);
                      if (n) setPlateNumber(n);
                    }}
                    placeholder="E.g. 59G2-038.80"
                    className="h-11 rounded-xl border-sky-100 focus:border-sky-500 focus:ring-sky-500/20 text-slate-800 font-mono font-bold text-sm bg-white"
                    onKeyDown={(e) => { if (e.key === 'Enter' && plateNumber.trim().length >= 7) proceedFromIdentify(); }}
                  />
                  {vehicleBrand && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 shadow-sm">
                      <Car size={11} /> Brand: {vehicleBrand}
                    </span>
                  )}

                  {/* Account feedback alerts */}
                  {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      </span>
                      <p className="text-xs text-emerald-800">
                        Member: <strong className="text-emerald-900">{plateAccountInfo.user?.fullName}</strong>
                      </p>
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                    <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-center gap-2.5">
                      <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      <p className="text-xs text-amber-800">
                        Plate <strong className="text-amber-900">{plateNumber.toUpperCase()}</strong> — <strong>Walk-in guest</strong> (no account).
                      </p>
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'package' && (
                    <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                      🅿️ Vehicle has a <strong>long-term package</strong>{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — next: capture portrait &amp; pick a free slot.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'reservation' && (
                    <div className="mt-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-800">
                      📅 Vehicle has a <strong>reservation</strong>{plateAccountInfo?.activeReservation?.code ? ` (code ${plateAccountInfo.activeReservation.code})` : ''} — next: capture portrait to confirm.
                    </div>
                  )}
                </div>

                <Button
                  onClick={proceedFromIdentify}
                  disabled={plateNumber.trim().length < 7 || !!buildingSupportWarning}
                  className="w-full h-11 gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold hover:brightness-110 disabled:opacity-60 rounded-xl shadow-md shadow-sky-500/20"
                >
                  Continue <ArrowRight size={16} />
                </Button>
              </div>
            )}

            {/* ── STEP 2: Capture portrait ── */}
            {!multiCamMode && step === 2 && (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl border border-sky-100 bg-slate-50 shadow-inner">
                  <LivePortraitCamera ref={portraitCamRef} deviceId={assignment.portrait} />
                </div>
                {portraitImage && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                    <UserSquare size={14} className="text-emerald-600" /> Portrait captured successfully — you can retake if needed.
                  </div>
                )}
                <div className="flex gap-2.5">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 gap-1.5 rounded-xl border-sky-100 hover:bg-sky-50 text-slate-600 font-bold">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    onClick={capturePortraitAndNext}
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-extrabold hover:brightness-110 rounded-xl shadow-md"
                  >
                    <UserSquare size={16} /> {portraitImage ? 'Retake & continue' : 'Capture portrait & continue'}
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Confirm check-in ── */}
            {!multiCamMode && step === 3 && (
              <div className="space-y-5">
                {checkInKind === 'package' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                    🅿️ Vehicle has a long-term package{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — pick a free slot below then check in.
                  </div>
                )}
                {checkInKind === 'reservation' && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-2.5 text-xs text-sky-800">
                    📅 Vehicle has a reservation{plateAccountInfo?.activeReservation?.code ? ` (code ${plateAccountInfo.activeReservation.code})` : ''} — confirm to admit.
                  </div>
                )}

                {/* Compare Photos Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Plate photo
                    </p>
                    <div className="aspect-[4/3] overflow-hidden rounded-xl border border-sky-100 bg-slate-50 flex items-center justify-center shadow-inner">
                      {plateImage ? (
                        <img src={plateImage} alt="Plate photo" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-slate-300" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Portrait photo</p>
                    <div className="aspect-[4/3] overflow-hidden rounded-xl border border-sky-100 bg-slate-50 flex items-center justify-center shadow-inner">
                      {portraitImage ? (
                        <img src={portraitImage} alt="Portrait photo" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-slate-300" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">License plate</label>
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    onBlur={(e) => {
                      const n = normalizePlate(e.target.value);
                      if (n) setPlateNumber(n);
                    }}
                    placeholder="E.g. 59G2-038.80"
                    className="h-11 rounded-xl border-sky-100 text-slate-800 font-mono font-bold text-sm bg-white"
                  />
                  {vehicleBrand && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 shadow-sm">
                      <Car size={11} /> Brand: {vehicleBrand}
                    </span>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-emerald-800">
                        Member: <strong className="text-emerald-900">{plateAccountInfo.user?.fullName}</strong>
                      </p>
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                    <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-xs text-amber-800">
                        Plate <strong className="text-amber-900">{plateNumber.toUpperCase()}</strong> — <strong>Walk-in guest</strong> (no account).
                      </p>
                    </div>
                  )}
                </div>

                {/* Vehicle type */}
                <div className="grid gap-2">
                  <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Vehicle type</label>
                  <div className="flex gap-2.5 p-1 rounded-xl bg-slate-50 border border-sky-100">
                    <button
                      type="button"
                      disabled={!allowedTypes.includes('CAR')}
                      onClick={() => setVehicleType('car')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-extrabold transition-all duration-200 ${vehicleType === 'car' ? 'bg-white text-sky-600 shadow-sm border border-sky-100/50' : 'text-slate-500 hover:text-slate-800 disabled:opacity-30'}`}
                    >
                      <Car size={13} className="text-sky-500" /> Car
                    </button>
                    <button
                      type="button"
                      disabled={!allowedTypes.includes('MOTORCYCLE')}
                      onClick={() => setVehicleType('motorcycle')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-extrabold transition-all duration-200 ${vehicleType === 'motorcycle' ? 'bg-white text-sky-600 shadow-sm border border-sky-100/50' : 'text-slate-500 hover:text-slate-800 disabled:opacity-30'}`}
                    >
                      <Bike size={13} className="text-sky-500" /> Motorcycle
                    </button>
                  </div>
                  {plateTypeWarning && <p className="text-[11px] text-amber-500 flex items-center gap-1"><AlertCircle size={11} /> {plateTypeWarning}</p>}
                  {buildingSupportWarning && <p className="text-[11px] text-rose-500 flex items-center gap-1"><AlertCircle size={11} /> {buildingSupportWarning}</p>}
                  {vehicleTypeMismatch && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle size={12} className="text-rose-500 shrink-0" /> Vehicle type does not match registration (registered: <strong>{plateAccountInfo?.registeredVehicleType === 'car' ? 'Car' : 'Motorcycle'}</strong>).
                      </span>
                      <button type="button" onClick={() => setRejectOpen(true)} className="shrink-0 rounded-lg bg-rose-500 px-3 py-1 text-[10px] font-black text-white hover:bg-rose-600">
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Parking slot selection */}
                {needsSlotSelection && (
                  <div className={`rounded-2xl border p-4 space-y-3 ${hasActivePackage ? 'border-amber-200 bg-amber-50/50' : 'border-sky-200 bg-sky-50/50'}`}>
                    <p className={`text-[11px] font-bold flex items-center gap-1.5 ${hasActivePackage ? 'text-amber-800' : 'text-sky-800'}`}>
                      <AlertCircle size={13} />
                      {isMotorcycle
                        ? 'Select a motorcycle zone — the system will assign an available spot automatically:'
                        : hasActivePackage
                        ? `Vehicle has a long-term package${plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''}${plateAccountInfo?.activePackage?.maxHoursPerDay ? ` · free ${plateAccountInfo.activePackage.maxHoursPerDay}h/day` : ''} — pick a zone & free slot:`
                        : 'Pick a zone & slot for the guest (required if the building has slots):'}
                      <span className="ml-1 inline-flex items-center rounded-full border border-white/15 bg-slate-950/40 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-300">
                        {usageLabel(slotUsageType)}
                      </span>
                    </p>

                    {plateAccountInfo?.activePackage?.slot ? (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 flex items-center justify-between text-xs text-amber-900 font-bold">
                        <div>
                          <p>Fixed Slot Assigned:</p>
                          <p className="text-[10px] text-amber-700 font-medium">This customer has pre-selected a fixed slot during subscription.</p>
                        </div>
                        <span className="inline-flex items-center rounded-lg bg-amber-500 text-white px-3 py-1.5 font-black text-xs uppercase shadow-sm">
                          {plateAccountInfo.activePackage.slot.code} {plateAccountInfo.activePackage.slot.floor && `· Floor ${plateAccountInfo.activePackage.slot.floor.name || plateAccountInfo.activePackage.slot.floor.code}`}
                        </span>
                      </div>
                    ) : freeSlots.length > 0 ? (
                      <div className={`grid gap-3 ${isMotorcycle ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Zone</label>
                          <select
                            value={selectedZoneId}
                            onChange={(e) => {
                              setSelectedZoneId(e.target.value);
                              setSelectedSlotId('');
                            }}
                            className={`h-9 w-full rounded-lg border border-sky-100 bg-white px-2 text-xs font-semibold text-slate-700 outline-none ${hasActivePackage ? 'focus:border-amber-400' : 'focus:border-sky-400'}`}
                          >
                            <option value="">-- Zone --</option>
                            {availableZones.map((z) => (
                              <option key={z._id} value={z._id}>
                                Zone {z.code}{z.usageType ? ` · ${usageLabel(z.usageType)}` : ''} ({z.count} free){z.usageType && z.usageType !== slotUsageType ? ' — fallback' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        {!isMotorcycle && <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Slot</label>
                          <select
                            value={selectedSlotId}
                            onChange={(e) => setSelectedSlotId(e.target.value)}
                            disabled={!selectedZoneId}
                            className={`h-9 w-full rounded-lg border border-sky-100 bg-white px-2 text-xs font-semibold text-slate-700 outline-none ${hasActivePackage ? 'focus:border-amber-400' : 'focus:border-sky-400'} disabled:opacity-50`}
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
                        </div>}
                        {selectedSlotId && (
                          <div className="col-span-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-semibold text-emerald-600">
                              System Recommended Spot: <strong className="text-emerald-800">{freeSlots.find(s => s._id === selectedSlotId)?.code}</strong> ({freeSlots.find(s => s._id === selectedSlotId)?.floor?.name || 'Floor 1'})
                            </span>
                          </div>
                        )}
                      </div>
                    ) : slotPoolState === 'capacity' ? (
                      <p className="text-[11px] text-slate-500">This building has no fixed slots — vehicles park by shared capacity.</p>
                    ) : slotPoolState === 'full' ? (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle size={12} className="text-rose-500" /> The building is full — no free slots to assign.
                      </p>
                    ) : (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle size={12} className="text-rose-500" /> No <strong>{usageLabel(slotUsageType)}</strong> slots free right now — remaining slots belong to other customer types, so this vehicle cannot check in.
                      </p>
                    )}

                    {/* Cảnh báo đối tượng của zone đang chọn */}
                    {zoneUsageBlocked && (
                      <p className="text-[11px] text-rose-600 flex items-center gap-1">
                        <AlertCircle size={12} className="text-rose-500" /> This zone ({usageLabel(selectedZone?.usageType)}) is not allowed for a <strong>{usageLabel(slotUsageType)}</strong> vehicle. Pick a compatible zone.
                      </p>
                    )}
                    {!zoneUsageBlocked && zoneUsageFallback && (
                      <p className="text-[11px] text-amber-600 flex items-center gap-1">
                        <AlertCircle size={12} className="text-amber-500" /> This is a <strong>{usageLabel(selectedZone?.usageType)}</strong> zone used as fallback for a {usageLabel(slotUsageType)} vehicle{hasExactZoneFree ? ` — ${usageLabel(slotUsageType)} zones are still free, prefer those.` : '.'}
                      </p>
                    )}
                    {isMotorcycle && selectedZoneId && (
                      <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] font-semibold text-emerald-700">
                        A free motorcycle spot will be assigned automatically in this zone when you confirm check-in.
                      </p>
                    )}
                  </div>
                )}

                {/* Missing capture checks */}
                {!portraitImage && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1.5 font-semibold">
                    <AlertCircle size={13} /> Requires a <strong>portrait photo</strong> to check in (go back to capture).
                  </p>
                )}
                {!plateImage && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1.5 font-semibold">
                    <AlertCircle size={13} /> Requires a <strong>license-plate photo</strong> to check in.
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2.5">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-11 gap-1.5 rounded-xl border-sky-100 hover:bg-sky-50 text-slate-600 font-bold">
                    <ArrowLeft size={16} /> Back
                  </Button>
                  <Button
                    onClick={onCheckIn}
                    disabled={!plateNumber.trim() || loading || !!buildingSupportWarning || zoneUsageBlocked || slotSelectionBlocked || vehicleTypeMismatch || !plateImage || !portraitImage || (needsSlotSelection && freeSlots.length > 0 && !selectedZoneId) || (!isMotorcycle && needsSlotSelection && freeSlots.length > 0 && !selectedSlotId)}
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold hover:brightness-110 disabled:opacity-60 rounded-xl shadow-md shadow-emerald-500/10"
                  >
                    <ScanLine size={16} /> Confirm &amp; Admit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRejectOpen(true)}
                    disabled={loading || !plateNumber.trim()}
                    className="h-11 border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl font-bold"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Operations Feedback Message */}
            {opMessage && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-4 text-sm font-semibold flex items-center gap-2 ${opMessage.type === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}
              >
                {opMessage.type === 'ok' ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <AlertCircle size={16} className="text-rose-500 shrink-0" />}
                <span>{opMessage.text}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom Guide info card */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 text-xs text-slate-500"
          style={{
            background: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(14,165,233,0.1)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className="mb-1 flex items-center gap-1.5 font-bold text-slate-700">
            <ScanLine size={13} className="text-sky-500" /> Packages &amp; reservations auto-detected
          </p>
          Vehicles with a <strong>package</strong> or a <strong>prior reservation</strong> are auto-matched as soon as the plate / QR is scanned in step 1 — no manual code entry needed.
          Fee collection &amp; vehicle exit are handled by the exit-gate staff in the{' '}
          <Link to="/staff/parked" className="font-bold text-sky-600 hover:underline">“Parked vehicles”</Link>.
        </div>
      </section>

      {/* Helper modals */}
      <CameraSettingsModal ops={ops} />
      <RejectCheckInModal ops={ops} />
      <UserQrInfoModal ops={ops} />

      {/* Barrier Gate IoT Simulation Overlay */}
      <BarrierGateOverlay barrierState={barrierState} action="admit" />
    </motion.div>
  );
}
