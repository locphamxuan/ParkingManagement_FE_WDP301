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
import { Slot3DBox } from '@/components/parking/Slot3DBox';
import type { ParkingSlot } from '@/services/manager/managerApi';
import { LivePlateCamera } from '@/components/staff/LivePlateCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import { type CameraRole } from '@/hooks/useCameraDevices';
import { normalizePlate } from '@/utils/plate';
import { useStaffOperations } from '@/hooks/staff/useStaffOperations';

export function StaffOperationsPage() {
  const {
    buildingId, building, entryGateId,
    loading, plateNumber, setPlateNumber, vehicleBrand, vehicleType, setVehicleType,
    opMessage, setOpMessage, plateImage, portraitImage,
    plateCamRef, qrCamRef, portraitCamRef,
    devices, assignment, assign, requestAndRefresh,
    cameraSettingsOpen, setCameraSettingsOpen, distinctDeviceCount, multiCamMode, setMultiCamMode,
    step, setStep, identifyMode, setIdentifyMode,
    plateAccountInfo, freeSlots, selectedSlotId, setSelectedSlotId, selectedZoneId, setSelectedZoneId,
    availableZones, rejectOpen, setRejectOpen, rejectReason, setRejectReason, userQrInfo, setUserQrInfo,
    allowedTypes, plateTypeWarning, buildingSupportWarning,
    hasActivePackage, checkInKind, needsSlotSelection,
    handlePlateDetected, proceedFromIdentify, capturePortraitAndNext,
    handleResolveIdQr, onCheckIn, onReject, vehicleTypeMismatch,
  } = useStaffOperations();


  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid gap-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Ca vận hành</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Check-in xe vào</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {building ? `${building.code} · ${building.name}` : 'Chưa chọn tòa nhà'}
            </p>
          </div>
          <Link
            to="/staff/parked"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80 lg:self-auto"
          >
            <Car size={14} /> Xe đang đỗ
          </Link>
        </div>
      </section>

      {/* Check-in — chế độ Tuần tự (1 camera/bước) hoặc Nhiều camera (mở cùng lúc) */}
      <section className={`mx-auto w-full space-y-4 ${multiCamMode ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Check-in xe vào</CardTitle>
              <div className="flex items-center gap-2">
                {/* Toggle chế độ */}
                <div className="flex rounded-lg border border-border bg-muted p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setMultiCamMode(false)}
                    className={`rounded-md px-2.5 py-1 transition ${!multiCamMode ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Tuần tự
                  </button>
                  <button
                    type="button"
                    onClick={() => setMultiCamMode(true)}
                    className={`rounded-md px-2.5 py-1 transition ${multiCamMode ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Nhiều camera
                  </button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => { setCameraSettingsOpen(true); void requestAndRefresh(); }}
                  className="gap-1.5 text-xs"
                  title="Gán camera cho từng vai trò (khi có nhiều camera)"
                >
                  <Settings size={13} /> Cài đặt camera
                </Button>
              </div>
            </div>
            {/* Step indicator (chỉ ở chế độ tuần tự) */}
            {!multiCamMode && (
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold">
              {[
                { n: 1, label: 'Nhận diện xe' },
                { n: 2, label: 'Chụp chân dung' },
                { n: 3, label: 'Xác nhận' },
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
            {multiCamMode && (
              <div className="space-y-5">
                <div className="grid gap-3 lg:grid-cols-3">
                  <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} busy={loading} deviceId={assignment.plate} buildingId={buildingId} />
                  <LivePortraitCamera ref={portraitCamRef} deviceId={assignment.portrait} />
                  <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} />
                </div>

                {distinctDeviceCount < 2 && (
                  <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
                    Đang dùng chung 1 webcam cho cả 3 vai trò nên các khung giống nhau. Cắm thêm camera rồi vào “Cài đặt camera” gán riêng từng cái để chụp biển số &amp; chân dung đồng thời.
                  </p>
                )}

                {/* Biển số + tài khoản */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Biển số xe</label>
                  <Input
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    onBlur={(e) => { const n = normalizePlate(e.target.value); if (n) setPlateNumber(n); }}
                    placeholder="59G2-038.80"
                    onKeyDown={(e) => { if (e.key === 'Enter' && !(!plateNumber.trim() || loading || !!buildingSupportWarning || (hasActivePackage && !selectedSlotId))) onCheckIn(); }}
                  />
                  {vehicleBrand && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
                      <Car size={11} /> Hãng xe: {vehicleBrand}
                    </span>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                      Thành viên: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      <strong className="text-foreground">Khách vãng lai</strong> (chưa có tài khoản).
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'package' && (
                    <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      🅿️ Xe có gói dài hạn{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — chọn chỗ trống bên dưới.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'reservation' && (
                    <div className="mt-1 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                      📅 Xe có đặt chỗ{plateAccountInfo?.activeReservation?.code ? ` (mã ${plateAccountInfo.activeReservation.code})` : ''}.
                    </div>
                  )}
                </div>

                {/* Loại xe + cảnh báo */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Loại xe</label>
                  <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                    <button type="button" disabled={!allowedTypes.includes('CAR')} onClick={() => setVehicleType('car')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'car' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}>
                      <Car size={13} /> Ô tô
                    </button>
                    <button type="button" disabled={!allowedTypes.includes('MOTORCYCLE')} onClick={() => setVehicleType('motorcycle')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}>
                      <Bike size={13} /> Xe máy
                    </button>
                  </div>
                  {plateTypeWarning && <p className="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> {plateTypeWarning}</p>}
                  {buildingSupportWarning && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertCircle size={11} /> {buildingSupportWarning}</p>}
                  {vehicleTypeMismatch && (
                    <p className="text-[11px] text-rose-300 flex items-center gap-1">
                      <AlertCircle size={12} /> Loại xe không khớp đăng ký (đã đăng ký: <strong>{plateAccountInfo?.registeredVehicleType === 'car' ? 'Ô tô' : 'Xe máy'}</strong>).
                    </p>
                  )}
                </div>

                {/* Chọn ô đỗ — gói dài hạn và standard (walk-in / user thường) */}
                {needsSlotSelection && (
                  <div className={`rounded-xl border p-3 space-y-3 ${hasActivePackage ? 'border-amber-500/30 bg-amber-500/10' : 'border-sky-500/30 bg-sky-500/10'}`}>
                    <p className={`text-[11px] font-bold flex items-center gap-1 ${hasActivePackage ? 'text-amber-300' : 'text-sky-300'}`}>
                      <AlertCircle size={12} />
                      {hasActivePackage ? 'Xe có gói dài hạn — chọn dãy & ô đỗ trống:' : 'Chọn dãy & ô đỗ cho khách:'}
                    </p>
                    
                    {freeSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Dãy (Zone)</label>
                          <select
                            value={selectedZoneId}
                            onChange={(e) => {
                              setSelectedZoneId(e.target.value);
                              setSelectedSlotId('');
                            }}
                            className={`h-9 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-xs font-semibold text-white outline-none ${hasActivePackage ? 'focus:border-amber-400/60' : 'focus:border-sky-400/60'}`}
                          >
                            <option value="">-- Dãy --</option>
                            {availableZones.map((z) => (
                              <option key={z._id} value={z._id}>
                                Dãy {z.code} ({z.count} ô trống)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Ô đỗ (Slot)</label>
                          <select
                            value={selectedSlotId}
                            onChange={(e) => setSelectedSlotId(e.target.value)}
                            disabled={!selectedZoneId}
                            className={`h-9 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-xs font-semibold text-white outline-none ${hasActivePackage ? 'focus:border-amber-400/60' : 'focus:border-sky-400/60'} disabled:opacity-50`}
                          >
                            <option value="">-- Ô đỗ --</option>
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
                    ) : (
                      <p className="text-[11px] text-slate-400">Tòa nhà không có slot cố định — xe đỗ theo sức chứa chung.</p>
                    )}

                    {/* Xem trước ô đỗ 3D được chọn */}
                    {selectedSlotId && (() => {
                      const sel = freeSlots.find((s) => s._id === selectedSlotId);
                      if (!sel) return null;
                      const preview = {
                        _id: sel._id, code: sel.code, status: 'available',
                        vehicleType: null, usageType: null, reservable: true, note: '',
                      } as unknown as ParkingSlot;
                      return (
                        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-slate-950/50 p-3 mt-1">
                          <div className="shrink-0 [perspective:600px] py-2 pl-2">
                            <div style={{ transform: 'rotateX(55deg) rotateZ(-45deg)', transformStyle: 'preserve-3d' }}>
                              <Slot3DBox slot={preview} />
                            </div>
                          </div>
                          <div className="text-[11px] leading-relaxed">
                            <p className="font-black text-white">Ô {sel.code}</p>
                            {sel.floor?.code && <p className="text-slate-400">Tầng {sel.floor.code}</p>}
                            <p className="text-emerald-400 font-bold">Sẵn sàng cho xe vào</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Cảnh báo ảnh còn thiếu (standard: cần cả biển số + chân dung từ camera) */}
                {checkInKind === 'standard' && !plateImage && (
                  <p className="text-[11px] text-rose-300 flex items-center gap-1">
                    <AlertCircle size={12} /> Cần bấm <strong>"Chụp &amp; nhận diện"</strong> ở camera biển số trước khi check-in.
                  </p>
                )}

                <p className="text-[11px] text-muted-foreground">Ảnh chân dung được chụp tự động từ camera chân dung khi bấm Check-in.</p>

                <div className="flex gap-2">
                  <Button
                    onClick={onCheckIn}
                    disabled={
                      !plateNumber.trim() ||
                      loading ||
                      !!buildingSupportWarning ||
                      (hasActivePackage && !selectedSlotId) ||
                      (checkInKind === 'standard' && !plateImage) ||
                      (checkInKind === 'standard' && freeSlots.length > 0 && !selectedSlotId)
                    }
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                  >
                    <ScanLine size={16} /> Check-in (xe vào)
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setRejectOpen(true)} disabled={loading || !plateNumber.trim()}
                    className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10">
                    Từ chối
                  </Button>
                </div>
              </div>
            )}

            {/* ── BƯỚC 1 — Nhận diện xe ── */}
            {!multiCamMode && step === 1 && (
              <div className="space-y-4">
                <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                  <button
                    type="button"
                    onClick={() => setIdentifyMode('plate')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'plate' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <ScanLine size={13} /> Quét biển số (AI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifyMode('qr')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-bold transition-all ${identifyMode === 'qr' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <QrCode size={13} /> Quét QR
                  </button>
                </div>

                {identifyMode === 'plate' ? (
                  <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} busy={loading} deviceId={assignment.plate} buildingId={buildingId} />
                ) : (
                  <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} />
                )}

                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Biển số xe (hoặc nhập tay)</label>
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
                      <Car size={11} /> Hãng xe: {vehicleBrand}
                    </span>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-emerald-400">
                        Thành viên: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                      </p>
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-xs text-amber-300">
                        Biển số <strong className="text-foreground">{plateNumber.toUpperCase()}</strong> — <strong>Khách vãng lai</strong> (chưa có tài khoản).
                      </p>
                    </div>
                  )}
                  {/* Badge loại check-in đã nhận diện */}
                  {plateNumber.trim().length >= 7 && checkInKind === 'package' && (
                    <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                      🅿️ Xe có <strong>gói dài hạn</strong>{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — bước sau chụp chân dung &amp; chọn chỗ trống.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'reservation' && (
                    <div className="mt-1 rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                      📅 Xe có <strong>đặt chỗ</strong>{plateAccountInfo?.activeReservation?.code ? ` (mã ${plateAccountInfo.activeReservation.code})` : ''} — bước sau chụp chân dung để xác nhận.
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && checkInKind === 'standard' && !plateImage && (
                    <div className="mt-1 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-[11px] text-rose-300">
                      Cần <strong>ảnh biển số</strong>: bấm “Chụp &amp; nhận diện” ở camera biển số (bắt buộc với khách vãng lai / user thường).
                    </div>
                  )}
                </div>

                <Button
                  onClick={proceedFromIdentify}
                  disabled={plateNumber.trim().length < 7 || !!buildingSupportWarning || (checkInKind === 'standard' && !plateImage)}
                  className="w-full h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                >
                  Tiếp tục <ArrowRight size={16} />
                </Button>
              </div>
            )}

            {/* ── BƯỚC 2 — Chụp chân dung ── */}
            {!multiCamMode && step === 2 && (
              <div className="space-y-4">
                <LivePortraitCamera ref={portraitCamRef} deviceId={assignment.portrait} />
                {portraitImage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400">
                    <UserSquare size={14} /> Đã có ảnh chân dung — có thể chụp lại nếu cần.
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-11 gap-1">
                    <ArrowLeft size={16} /> Quay lại
                  </Button>
                  <Button onClick={capturePortraitAndNext} className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110">
                    <UserSquare size={16} /> {portraitImage ? 'Chụp lại & tiếp tục' : 'Chụp chân dung & tiếp tục'}
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
                    🅿️ Xe có gói dài hạn{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — chọn chỗ trống bên dưới rồi check-in.
                  </div>
                )}
                {checkInKind === 'reservation' && (
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 text-xs text-sky-300">
                    📅 Xe có đặt chỗ{plateAccountInfo?.activeReservation?.code ? ` (mã ${plateAccountInfo.activeReservation.code})` : ''} — xác nhận để cho vào.
                  </div>
                )}

                {/* Ảnh đã chụp — chân dung bắt buộc cho mọi loại; biển bắt buộc với vãng lai/user thường */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Ảnh biển số{checkInKind !== 'standard' ? ' (tuỳ chọn)' : ''}
                    </p>
                    <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
                      {plateImage ? (
                        <img src={plateImage} alt="Ảnh biển số" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ảnh chân dung</p>
                    <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/40 flex items-center justify-center">
                      {portraitImage ? (
                        <img src={portraitImage} alt="Ảnh chân dung" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Biển số + tài khoản */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Biển số xe</label>
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
                      <Car size={11} /> Hãng xe: {vehicleBrand}
                    </span>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
                    <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-emerald-400">
                        Thành viên: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email})
                      </p>
                    </div>
                  )}
                  {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
                    <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <p className="text-xs text-amber-300">
                        Biển số <strong className="text-foreground">{plateNumber.toUpperCase()}</strong> — <strong>Khách vãng lai</strong> (chưa có tài khoản).
                      </p>
                    </div>
                  )}
                </div>

                {/* Loại xe + cảnh báo */}
                <div className="grid gap-1.5">
                  <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Loại xe</label>
                  <div className="flex gap-2 p-1 rounded-lg bg-muted border border-border">
                    <button
                      type="button"
                      disabled={!allowedTypes.includes('CAR')}
                      onClick={() => setVehicleType('car')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'car' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
                    >
                      <Car size={13} /> Ô tô
                    </button>
                    <button
                      type="button"
                      disabled={!allowedTypes.includes('MOTORCYCLE')}
                      onClick={() => setVehicleType('motorcycle')}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md text-xs font-bold transition-all ${vehicleType === 'motorcycle' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground disabled:opacity-30'}`}
                    >
                      <Bike size={13} /> Xe máy
                    </button>
                  </div>
                  {plateTypeWarning && <p className="text-[11px] text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> {plateTypeWarning}</p>}
                  {buildingSupportWarning && <p className="text-[11px] text-rose-400 flex items-center gap-1"><AlertCircle size={11} /> {buildingSupportWarning}</p>}
                  {vehicleTypeMismatch && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-[11px] text-rose-300 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1">
                        <AlertCircle size={12} /> Loại xe không khớp đăng ký (đã đăng ký: <strong>{plateAccountInfo?.registeredVehicleType === 'car' ? 'Ô tô' : 'Xe máy'}</strong>).
                      </span>
                      <button type="button" onClick={() => setRejectOpen(true)} className="shrink-0 rounded-md bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-rose-400">
                        Từ chối
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
                        ? `Xe có gói dài hạn${plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''}${plateAccountInfo?.activePackage?.maxHoursPerDay ? ` · free ${plateAccountInfo.activePackage.maxHoursPerDay}h/ngày` : ''} — chọn dãy & ô đỗ trống:`
                        : 'Chọn dãy & ô đỗ cho khách (bắt buộc nếu tòa nhà có slot):'}
                    </p>
                    
                    {freeSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Dãy (Zone)</label>
                          <select
                            value={selectedZoneId}
                            onChange={(e) => {
                              setSelectedZoneId(e.target.value);
                              setSelectedSlotId('');
                            }}
                            className={`h-9 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-xs font-semibold text-white outline-none ${hasActivePackage ? 'focus:border-amber-400/60' : 'focus:border-sky-400/60'}`}
                          >
                            <option value="">-- Dãy --</option>
                            {availableZones.map((z) => (
                              <option key={z._id} value={z._id}>
                                Dãy {z.code} ({z.count} ô trống)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider font-mono">Ô đỗ (Slot)</label>
                          <select
                            value={selectedSlotId}
                            onChange={(e) => setSelectedSlotId(e.target.value)}
                            disabled={!selectedZoneId}
                            className={`h-9 w-full rounded-lg border border-white/10 bg-slate-950 px-2 text-xs font-semibold text-white outline-none ${hasActivePackage ? 'focus:border-amber-400/60' : 'focus:border-sky-400/60'} disabled:opacity-50`}
                          >
                            <option value="">-- Ô đỗ --</option>
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
                    ) : (
                      <p className="text-[11px] text-slate-400">Tòa nhà không có slot cố định — xe sẽ đỗ theo sức chứa chung.</p>
                    )}
                  </div>
                )}

                {/* Nhắc thiếu ảnh: chân dung bắt buộc mọi loại; biển bắt buộc với vãng lai/user thường */}
                {(!portraitImage || (checkInKind === 'standard' && !plateImage)) && (
                  <p className="text-[11px] text-rose-300 flex items-center gap-1">
                    <AlertCircle size={12} /> Cần <strong>ảnh chân dung</strong>
                    {checkInKind === 'standard' ? <> và <strong>ảnh biển số</strong></> : null} mới check-in được (quay lại bước trước để chụp).
                  </p>
                )}

                {/* Nút hành động */}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-11 gap-1">
                    <ArrowLeft size={16} /> Quay lại
                  </Button>
                  <Button
                    onClick={onCheckIn}
                    disabled={!plateNumber.trim() || loading || !!buildingSupportWarning || !portraitImage || (hasActivePackage && !selectedSlotId) || (checkInKind === 'standard' && !plateImage) || (checkInKind === 'standard' && freeSlots.length > 0 && !selectedSlotId)}
                    className="flex-1 h-11 gap-2 bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 disabled:opacity-60"
                  >
                    <ScanLine size={16} /> Check-in (xe vào)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRejectOpen(true)}
                    disabled={loading || !plateNumber.trim()}
                    className="h-11 border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                  >
                    Từ chối
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
            <ScanLine size={13} className="text-primary" /> Gói &amp; đặt chỗ tự nhận diện
          </p>
          Xe <strong>mua gói</strong> hoặc <strong>đặt chỗ trước</strong> được hệ thống tự đối chiếu ngay khi quét biển số / QR ở bước 1 — không cần nhập mã thủ công.
          Việc thu phí &amp; cho xe ra do nhân viên cổng ra thực hiện ở tab{' '}
          <Link to="/staff/parked" className="font-semibold text-primary hover:underline">“Xe đang đỗ”</Link>.
        </div>
      </section>

      {/* Cài đặt camera — gán thiết bị vật lý cho từng vai trò */}
      {cameraSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Thiết bị</p>
                <h3 className="text-xl font-semibold text-foreground">Cài đặt camera</h3>
              </div>
              <button onClick={() => setCameraSettingsOpen(false)} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>

            <p className="mb-4 text-xs text-muted-foreground">
              Khi có nhiều camera (biển số / chân dung / QR), gán mỗi vai trò vào một thiết bị riêng để
              mở đồng thời và chụp đúng hình. Trên máy 1 webcam thì các vai trò dùng chung 1 thiết bị.
            </p>

            <div className="space-y-3">
              {([
                { role: 'plate' as CameraRole, label: 'Camera 1 · Biển số' },
                { role: 'qr' as CameraRole, label: 'Camera 2 · QR' },
                { role: 'portrait' as CameraRole, label: 'Camera 3 · Chân dung' },
              ]).map(({ role, label }) => (
                <div key={role} className="grid gap-1.5">
                  <label className="text-xs font-semibold text-foreground">{label}</label>
                  <select
                    value={assignment[role] ?? ''}
                    onChange={(e) => assign(role, e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
                  >
                    <option value="">— Tự động (mặc định) —</option>
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
                Chưa thấy thiết bị nào — bấm “Làm mới” và cấp quyền camera cho trình duyệt.
              </p>
            )}

            <div className="mt-5 flex justify-between gap-2">
              <Button type="button" variant="secondary" onClick={() => void requestAndRefresh()} className="gap-1.5 text-xs">
                <Settings size={13} /> Làm mới danh sách
              </Button>
              <Button onClick={() => setCameraSettingsOpen(false)} className="bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 text-xs">
                Xong
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Từ chối check-in */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Từ chối cho xe vào</p>
                <h3 className="text-xl font-semibold text-foreground">Lý do từ chối</h3>
              </div>
              <button onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Biển số <strong className="text-foreground font-mono">{normalizePlate(plateNumber) || plateNumber || '—'}</strong>. Hệ thống sẽ gửi thông báo kèm lý do đến tài khoản khách (nếu biển đã đăng ký).
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Vd: Đăng ký xe máy nhưng thực tế là ô tô; thông tin phương tiện không khớp..."
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/50"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-xs">Hủy</Button>
              <Button onClick={onReject} disabled={!rejectReason.trim()} className="bg-rose-500 text-white hover:bg-rose-400 text-xs disabled:opacity-60">
                Xác nhận từ chối
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Thông tin tài khoản user từ QR scan */}
      {userQrInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Tài khoản đã quét</p>
                <h3 className="text-lg font-semibold text-foreground">{userQrInfo.fullName}</h3>
                <p className="text-xs text-muted-foreground">{userQrInfo.email}</p>
              </div>
              <button onClick={() => setUserQrInfo(null)} className="text-muted-foreground hover:text-foreground transition">✕</button>
            </div>

            {userQrInfo.walletBalance != null && (
              <div className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/8 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Số dư ví</span>
                <span className="font-mono font-bold text-violet-400">{userQrInfo.walletBalance.toLocaleString('vi-VN')} ₫</span>
              </div>
            )}

            <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Gói dài hạn đang hoạt động
            </div>
            {userQrInfo.activePackages.length === 0 ? (
              <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Khách chưa có gói dài hạn nào đang hoạt động.
              </p>
            ) : (
              <div className="space-y-2">
                {userQrInfo.activePackages.map((pkg) => (
                  <div key={pkg.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-emerald-400">{pkg.name}</span>
                      {pkg.code && (
                        <span className="rounded-md border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-500">{pkg.code}</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Biển số: <strong className="text-foreground font-mono">{pkg.plateNumber}</strong>
                      {pkg.endDate && (
                        <span className="ml-2 text-slate-500">
                          · Hết hạn: {new Date(pkg.endDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={() => setUserQrInfo(null)} className="mt-5 w-full" variant="secondary">
              Đóng
            </Button>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
