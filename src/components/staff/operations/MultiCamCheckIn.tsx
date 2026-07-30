import { ScanLine, AlertCircle, Car, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slot3DBox } from '@/components/parking/Slot3DBox';
import type { ParkingSlot } from '@/services/manager/managerApi';
import { LivePlateCamera } from '@/components/staff/LivePlateCamera';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { LivePortraitCamera } from '@/components/staff/LivePortraitCamera';
import { normalizePlate } from '@/utils/plate';
import { usageLabel, type StaffOperations } from '@/hooks/staff/useStaffOperations';

export function MultiCamCheckIn({ ops }: { ops: StaffOperations }) {
  const {
    buildingId, loading, plateNumber, setPlateNumber, vehicleBrand, vehicleType, setVehicleType,
    plateCamRef, qrCamRef, portraitCamRef, assignment, distinctDeviceCount, multiCamMode, identificationMethod,
    plateAccountInfo, freeSlots, selectedSlotId, setSelectedSlotId, selectedZoneId, setSelectedZoneId,
    availableZones, setRejectOpen, allowedTypes, plateTypeWarning, buildingSupportWarning,
    hasActivePackage, checkInKind, needsSlotSelection, isMotorcycle,
    slotUsageType, selectedZone, zoneUsageBlocked, zoneUsageFallback, hasExactZoneFree,
    slotPoolState, slotSelectionBlocked,
    handlePlateDetected, handleResolveIdQr, onCheckIn, vehicleTypeMismatch,
  } = ops;

  if (!multiCamMode) return null;

  return (
    <div className="space-y-5">
      <div className={`grid gap-3 ${identificationMethod === 'qr' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'}`}>
        {identificationMethod !== 'qr' && (
          <LivePlateCamera ref={plateCamRef} onDetected={handlePlateDetected} busy={loading} deviceId={assignment.plate} buildingId={buildingId} />
        )}
        <LivePortraitCamera ref={portraitCamRef} deviceId={assignment.portrait} />
        <LiveQRCamera ref={qrCamRef} onResult={handleResolveIdQr} deviceId={assignment.qr} />
      </div>

      {distinctDeviceCount < 2 && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
          A single webcam is shared across all 3 roles, so the frames look identical. Plug in more cameras, then open “Camera settings” to assign each one separately to capture the plate &amp; portrait simultaneously.
        </p>
      )}

      {/* Biển số + tài khoản */}
      <div className="grid gap-1.5">
        <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">License plate</label>
        <Input
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          onBlur={(e) => { const n = normalizePlate(e.target.value); if (n) setPlateNumber(n); }}
          placeholder="59G2-038.80"
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            const missingZone = needsSlotSelection && freeSlots.length > 0 && !selectedZoneId;
            const missingCarSlot = needsSlotSelection && !isMotorcycle && freeSlots.length > 0 && !selectedSlotId;
            const canSubmit =
              Boolean(plateNumber.trim()) &&
              !loading &&
              !buildingSupportWarning &&
              !zoneUsageBlocked &&
              !slotSelectionBlocked &&
              !vehicleTypeMismatch &&
              !missingZone &&
              !missingCarSlot;
            if (canSubmit) onCheckIn();
          }}
        />
        {vehicleBrand && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300">
            <Car size={11} /> Brand: {vehicleBrand}
          </span>
        )}
        {plateNumber.trim().length >= 7 && plateAccountInfo?.hasAccount && (
          <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
            Member: <strong className="text-foreground">{plateAccountInfo.user?.fullName}</strong>
          </div>
        )}
        {plateNumber.trim().length >= 7 && plateAccountInfo && !plateAccountInfo.hasAccount && (
          <div className="mt-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-300">
            <strong className="text-foreground">Walk-in guest</strong> (no account).
          </div>
        )}
        {plateNumber.trim().length >= 7 && checkInKind === 'package' && (
          <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
            🅿️ Vehicle has a long-term package{plateAccountInfo?.activePackage?.name ? ` "${plateAccountInfo.activePackage.name}"` : ''} — {isMotorcycle ? 'select a parking zone below; the system will assign capacity automatically.' : 'pick a free slot below.'}
          </div>
        )}
      </div>

      {/* Loại xe + cảnh báo */}
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

      {/* Chọn ô đỗ — gói dài hạn và standard (walk-in / user thường) */}
      {needsSlotSelection && (
        <div className={`rounded-xl border p-3 space-y-3 ${hasActivePackage ? 'border-amber-500/30 bg-amber-500/10' : 'border-sky-500/30 bg-sky-500/10'}`}>
          <p className={`text-[11px] font-bold flex items-center gap-1 ${hasActivePackage ? 'text-amber-300' : 'text-sky-300'}`}>
            <AlertCircle size={12} />
            {isMotorcycle
              ? 'Select the motorcycle parking zone — the system will assign an available spot automatically:'
              : hasActivePackage ? 'Vehicle has a long-term package — pick a zone & free slot:' : 'Pick a zone & slot for the guest:'}
            <span className="ml-1 inline-flex items-center rounded-full border border-white/15 bg-slate-950/40 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-300">
              {usageLabel(slotUsageType)}
            </span>
          </p>

          {freeSlots.length > 0 ? (
            <div className={`grid gap-2 ${isMotorcycle ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
              {!isMotorcycle && <div>
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
              </div>}
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
          {isMotorcycle && selectedZoneId && (
            <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-[11px] font-semibold text-emerald-400">
              A free motorcycle spot will be assigned automatically in this zone when you confirm check-in.
            </p>
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
                  <p className="font-black text-white">Slot {sel.code}</p>
                  {sel.floor?.code && <p className="text-slate-400">Floor {sel.floor.code}</p>}
                  <p className="text-emerald-400 font-bold">Ready for entry</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">The portrait is captured automatically from the portrait camera when you tap Check-in.</p>

      <div className="flex gap-2">
        <Button
          onClick={onCheckIn}
          disabled={
            !plateNumber.trim() ||
            loading ||
            !!buildingSupportWarning ||
            zoneUsageBlocked ||
            slotSelectionBlocked ||
            vehicleTypeMismatch ||
            (needsSlotSelection && freeSlots.length > 0 && !selectedZoneId) ||
            (!isMotorcycle && needsSlotSelection && freeSlots.length > 0 && !selectedSlotId)
          }
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
  );
}
