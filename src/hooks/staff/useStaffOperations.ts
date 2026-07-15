import { useEffect, useMemo, useRef, useState } from 'react';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type PlateInfo } from '@/services/staff/staffApi';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
import { type PlateScanResult, type LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { useCameraDevices } from '@/hooks/useCameraDevices';
import { normalizePlate } from '@/utils/plate';

export type VehicleKind = 'car' | 'motorcycle';
export type OperationMode = 'check-in' | 'check-out';

// Loại xe tòa nhà hỗ trợ (staff luôn có thể chọn cả 2). Đặt ở module scope để
// tham chiếu ổn định — tránh effect tự-nhận-diện chạy lại mỗi lần render và ghi
// đè lựa chọn loại xe thủ công của nhân viên.
const ALLOWED_TYPES = ['CAR', 'MOTORCYCLE'];

// Chuỗi ưu tiên đối tượng cho slot (mirror BE helpers.js USAGE_FALLBACK_CHAIN):
// hội viên/đặt chỗ có thể mượn tạm slot chung (walk_in) khi hết slot đúng đối tượng,
// NHƯNG khách vãng lai KHÔNG lấn slot hội viên/gói/đặt chỗ. Index nhỏ = ưu tiên hơn.
const USAGE_FALLBACK_CHAIN: Record<string, string[]> = {
  walk_in: ['walk_in'],
  registered: ['registered', 'walk_in'],
  subscriber: ['subscriber', 'registered', 'walk_in'],
  reserved: ['reserved', 'registered', 'walk_in'],
};
const acceptableUsageTypes = (u?: string | null): string[] =>
  (u && USAGE_FALLBACK_CHAIN[u]) || (u ? [u] : []);

// Nhãn đối tượng sử dụng slot (usageType) hiển thị cho staff.
const USAGE_LABEL: Record<string, string> = {
  walk_in: 'Walk-in',
  registered: 'Registered',
  subscriber: 'Subscriber',
  reserved: 'Reserved',
};
export const usageLabel = (u?: string | null) => (u ? USAGE_LABEL[u] || u : '');

/**
 * Toàn bộ state + logic của màn Check-in (Staff Operations). Tách khỏi component
 * để phần JSX thuần trình bày. Component destructure các giá trị trả về.
 */
export function useStaffOperations() {
  const { buildingId, building } = useBuildingContext();
  const { gates } = useAssignedGates();
  const entryGateId = gates.find((g) => g.direction === 'in' || g.direction === 'both')?._id;

  const [loading, setLoading] = useState(false);

  // Form state
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState<string | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleKind>('car');
  const [opMessage, setOpMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Captured camera snapshots (saved to DB at check-in).
  const [plateImage, setPlateImage] = useState<string | null>(null);
  const [portraitImage, setPortraitImage] = useState<string | null>(null);
  const plateCamRef = useRef<LiveCameraHandle>(null);
  const qrCamRef = useRef<LiveCameraHandle>(null);
  const portraitCamRef = useRef<LiveCameraHandle>(null);

  // Gán thiết bị camera vật lý cho từng vai trò (hỗ trợ nhiều camera thực tế).
  const { devices, assignment, assign, requestAndRefresh } = useCameraDevices();
  const [cameraSettingsOpen, setCameraSettingsOpen] = useState(false);
  const distinctDeviceCount = new Set(
    [assignment.plate, assignment.portrait, assignment.qr].filter(Boolean),
  ).size;
  const [multiCamMode, setMultiCamMode] = useState(() => distinctDeviceCount >= 2);

  // Wizard tuần tự: 1: Nhận diện xe · 2: Chụp chân dung · 3: Xác nhận & check-in
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifyMode, setIdentifyMode] = useState<'plate' | 'qr'>('plate');

  const [plateAccountInfo, setPlateAccountInfo] = useState<PlateInfo | null>(null);
  const [freeSlots, setFreeSlots] = useState<{ _id: string; code: string; floor?: { name?: string; code?: string } | null; zone?: { _id: string; code: string; usageType: string } | string | null }[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  // Bối cảnh sức chứa toàn tòa (không lọc đối tượng) để phân biệt các trạng thái rỗng.
  const [slotPoolStats, setSlotPoolStats] = useState<{ totalSlots: number; totalAvailable: number }>({ totalSlots: 0, totalAvailable: 0 });

  // ── Đối tượng sử dụng (usageType) suy từ BE để gọi free-slots đúng pool + validate zone ──
  const hasActivePackage = Boolean(plateAccountInfo?.hasActivePackage);
  const hasActiveReservation = Boolean(plateAccountInfo?.hasActiveReservation);
  const checkInKind: 'package' | 'reservation' | 'standard' = hasActivePackage
    ? 'package'
    : hasActiveReservation
      ? 'reservation'
      : 'standard';
  const needsSlotSelection = hasActivePackage || checkInKind === 'standard';

  // Đối tượng thật để lọc slot: gói → subscriber; biển có tài khoản (không gói/đặt chỗ)
  // → registered; còn lại → walk_in. (reserved đã có slot cố định nên không chọn zone.)
  const slotUsageType: 'walk_in' | 'registered' | 'subscriber' = hasActivePackage
    ? 'subscriber'
    : plateAccountInfo?.usageType === 'registered'
      ? 'registered'
      : 'walk_in';
  const zoneChain = acceptableUsageTypes(slotUsageType);

  const availableZones = useMemo(() => {
    const rank = (u?: string | null) => {
      const i = u ? zoneChain.indexOf(u) : -1;
      return i === -1 ? zoneChain.length : i;
    };
    const zonesMap = new Map<string, { _id: string; code: string; usageType?: string; count: number }>();
    freeSlots.forEach((slot) => {
      if (slot.zone && typeof slot.zone === 'object') {
        const existing = zonesMap.get(slot.zone._id);
        if (existing) existing.count += 1;
        else zonesMap.set(slot.zone._id, { ...slot.zone, count: 1 });
      }
    });
    // Ưu tiên dãy ĐÚNG đối tượng lên đầu, dãy "mượn tạm" (fallback) xuống dưới.
    return Array.from(zonesMap.values()).sort(
      (a, b) => rank(a.usageType) - rank(b.usageType) || String(a.code).localeCompare(String(b.code)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeSlots, slotUsageType]);

  // Zone đang chọn + trạng thái hợp lệ theo đối tượng.
  const selectedZone = useMemo(
    () => availableZones.find((z) => z._id === selectedZoneId) || null,
    [availableZones, selectedZoneId],
  );
  const selectedZoneUsage = selectedZone?.usageType || null;
  // Ngoài chuỗi fallback → chặn cứng (phòng thủ; pool từ BE đã lọc nên hiếm khi xảy ra,
  // nhưng bảo vệ trước dữ liệu cũ/lệch, khớp guard SLOT_USAGE_MISMATCH của BE lúc submit).
  const zoneUsageBlocked = Boolean(selectedZoneUsage && !zoneChain.includes(selectedZoneUsage));
  // Hợp lệ nhưng là dãy mượn tạm (không đúng đối tượng) → cảnh báo mềm, vẫn cho check-in.
  const zoneUsageFallback = Boolean(
    selectedZoneUsage && selectedZoneUsage !== slotUsageType && zoneChain.includes(selectedZoneUsage),
  );
  // Còn dãy đúng đối tượng đang trống? (nhắc staff ưu tiên dãy đúng thay vì mượn tạm)
  const hasExactZoneFree = availableZones.some((z) => z.usageType === slotUsageType);

  // Trạng thái pool slot khi KHÔNG có slot hợp đối tượng để hiện — phân biệt 3 case:
  //  - 'ok'        : còn slot hợp đối tượng để chọn (freeSlots > 0).
  //  - 'capacity'  : tòa không có slot cố định → đỗ theo sức chứa (cho phép check-in).
  //  - 'exhausted' : tòa còn slot trống NHƯNG thuộc đối tượng khác → không được lấn (chặn).
  //  - 'full'      : hết sạch slot trống toàn tòa → đầy (chặn).
  const slotPoolState: 'ok' | 'capacity' | 'exhausted' | 'full' =
    freeSlots.length > 0
      ? 'ok'
      : slotPoolStats.totalSlots === 0
        ? 'capacity'
        : slotPoolStats.totalAvailable > 0
          ? 'exhausted'
          : 'full';
  // Chặn check-in khi cần slot mà pool rỗng vì lý do không hợp lệ (đầy / chỉ còn slot
  // đối tượng khác). 'capacity' KHÔNG chặn (đỗ theo sức chứa là hợp lệ).
  const slotSelectionBlocked = needsSlotSelection && (slotPoolState === 'exhausted' || slotPoolState === 'full');

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [userQrInfo, setUserQrInfo] = useState<{
    fullName: string;
    email: string;
    walletBalance?: number;
    activePackages: { id: string; name: string; code: string | null; plateNumber: string; endDate?: string }[];
  } | null>(null);

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

  // Tự nhận diện loại xe khi BIỂN SỐ thay đổi (không ghi đè khi nhân viên tự đổi).
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
      return `This building does not support ${vehicleType === 'car' ? 'cars' : 'motorcycles'}.`;
    return null;
  }, [allowedTypes, vehicleType]);

  // Tự động tra cứu chủ biển số
  useEffect(() => {
    const clean = plateNumber.trim().toUpperCase();
    if (clean.length >= 7) {
      let cancelled = false;
      staffApi
        .lookupPlate(clean, buildingId)
        .then((res) => {
          if (!cancelled) setPlateAccountInfo((res as { data?: PlateInfo })?.data ?? null);
        })
        .catch(() => undefined);
      return () => { cancelled = true; };
    } else {
      setPlateAccountInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plateNumber]);

  // Đổi ĐỐI TƯỢNG hoặc TÒA → pool slot hợp lệ đổi → bỏ lựa chọn cũ để không giữ lại
  // zone/slot không còn hợp đối tượng mới (tránh submit slot sai pool → BE trả lỗi).
  useEffect(() => {
    setSelectedZoneId('');
    setSelectedSlotId('');
  }, [slotUsageType, buildingId]);

  useEffect(() => {
    if (!needsSlotSelection || !buildingId) {
      setFreeSlots([]);
      setSelectedSlotId('');
      setSelectedZoneId('');
      setSlotPoolStats({ totalSlots: 0, totalAvailable: 0 });
      return;
    }
    let cancelled = false;
    // Dùng đối tượng THẬT của biển số (subscriber/registered/walk_in) để BE trả đúng
    // pool theo chuỗi fallback — không còn ép mọi biển có tài khoản về walk_in.
    staffApi
      .freeSlots(buildingId, { vehicleType, usageType: slotUsageType })
      .then((res) => {
        if (cancelled) return;
        const data = (res as { data?: { items?: typeof freeSlots; totalSlots?: number; totalAvailable?: number } })?.data;
        setFreeSlots(data?.items ?? []);
        setSlotPoolStats({ totalSlots: data?.totalSlots ?? 0, totalAvailable: data?.totalAvailable ?? 0 });
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSlotSelection, buildingId, vehicleType, slotUsageType]);

  const applyPlate = (plate: string, brand: string | null = null) => {
    const clean = normalizePlate(plate) || plate.trim().toUpperCase();
    setPlateNumber(clean);
    if (brand) setVehicleBrand(brand);
  };

  const handlePlateDetected = ({ plateNumber: plate, brand, plateImage: img }: PlateScanResult) => {
    setPlateImage(img);
    if (plate) applyPlate(plate, brand);
  };

  const proceedFromIdentify = () => {
    setStep(2);
  };

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

  const handleResolveIdQr = async (code: string) => {
    try {
      const res = await staffApi.resolveQr(code);
      const data = (res as {
        data?: {
          kind: 'plate' | 'user';
          plate?: { plateNumber: string; vehicleType?: string; brand?: string | null } | null;
          user?: { id: string; fullName: string; email: string; walletBalance?: number } | null;
          activePackages?: { id: string; name: string; code: string | null; plateNumber: string; endDate?: string }[];
        };
      })?.data;
      if (!data) {
        setOpMessage({ type: 'err', text: 'Could not read the QR code.' });
        return;
      }
      if (data.kind === 'plate' && data.plate?.plateNumber) {
        if (data.plate.vehicleType === 'motorcycle') setVehicleType('motorcycle');
        else if (data.plate.vehicleType) setVehicleType('car');
        applyPlate(data.plate.plateNumber, data.plate.brand ?? null);
        setOpMessage({ type: 'ok', text: `Plate ${data.plate.plateNumber} recognized. Tap "Continue".` });
      } else if (data.user) {
        setUserQrInfo({
          fullName: data.user.fullName,
          email: data.user.email,
          walletBalance: data.user.walletBalance,
          activePackages: data.activePackages ?? [],
        });
        setOpMessage({ type: 'ok', text: `Account recognized: ${data.user.fullName}. Please scan/enter the plate number.` });
      } else {
        setOpMessage({ type: 'err', text: 'The QR code does not match any account or vehicle.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'QR lookup error.' });
    }
  };

  const resetForm = () => {
    setPlateNumber('');
    setVehicleBrand(null);
    setPlateImage(null);
    setPortraitImage(null);
    setPlateAccountInfo(null);
    setFreeSlots([]);
    setSelectedSlotId('');
    setSelectedZoneId('');
    setStep(1);
    setIdentifyMode('plate');
  };

  const onCheckIn = async () => {
    setOpMessage(null);
    if (hasActivePackage && !selectedSlotId) {
      setOpMessage({ type: 'err', text: 'This vehicle has a long-term package — please pick a free slot before checking in.' });
      return;
    }
    if (zoneUsageBlocked) {
      setOpMessage({ type: 'err', text: 'The selected zone is not allowed for this customer type. Please pick a compatible zone.' });
      return;
    }
    if (slotSelectionBlocked) {
      setOpMessage({
        type: 'err',
        text: slotPoolState === 'full'
          ? 'The building is full — no free slots to assign.'
          : 'No slots available for this customer type (remaining slots belong to other customer types).',
      });
      return;
    }
    setLoading(true);
    const currentPlate = normalizePlate(plateNumber) || plateNumber.trim().toUpperCase();
    const plateImg = plateImage ?? plateCamRef.current?.capture() ?? null;
    const portraitImg = portraitImage ?? portraitCamRef.current?.capture() ?? null;
    try {
      await staffApi.checkIn({
        plateNumber: currentPlate,
        vehicleType: vehicleType === 'motorcycle' ? 'motorcycle' : 'car',
        building: buildingId || undefined,
        vehicleBrand: vehicleBrand || undefined,
        plateImage: plateImg,
        portraitImage: portraitImg,
        slot: selectedSlotId || undefined,
        gate: entryGateId || undefined,
      });
      setOpMessage({ type: 'ok', text: `Parking session created for plate ${currentPlate}.` });
      resetForm();
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-in failed' });
    } finally {
      setLoading(false);
    }
  };

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
        text: `Rejected entry for plate ${plate}.${notified ? ' Guest has been notified.' : ' (The plate has no account, so no notification was sent.)'}`,
      });
      setRejectOpen(false);
      setRejectReason('');
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Rejection failed' });
    }
  };

  const vehicleTypeMismatch = Boolean(
    plateAccountInfo?.registeredVehicleType && plateAccountInfo.registeredVehicleType !== vehicleType,
  );

  return {
    buildingId, building, gates, entryGateId,
    loading, setLoading,
    plateNumber, setPlateNumber,
    vehicleBrand, setVehicleBrand,
    vehicleType, setVehicleType,
    opMessage, setOpMessage,
    plateImage, setPlateImage,
    portraitImage, setPortraitImage,
    plateCamRef, qrCamRef, portraitCamRef,
    devices, assignment, assign, requestAndRefresh,
    cameraSettingsOpen, setCameraSettingsOpen,
    distinctDeviceCount,
    multiCamMode, setMultiCamMode,
    step, setStep,
    identifyMode, setIdentifyMode,
    plateAccountInfo, setPlateAccountInfo,
    freeSlots, setFreeSlots,
    selectedSlotId, setSelectedSlotId,
    selectedZoneId, setSelectedZoneId,
    availableZones,
    slotUsageType, selectedZone, zoneUsageBlocked, zoneUsageFallback, hasExactZoneFree,
    slotPoolState, slotSelectionBlocked, slotPoolStats,
    rejectOpen, setRejectOpen,
    rejectReason, setRejectReason,
    userQrInfo, setUserQrInfo,
    allowedTypes,
    plateTypeWarning,
    buildingSupportWarning,
    hasActivePackage, hasActiveReservation, checkInKind, needsSlotSelection,
    applyPlate, handlePlateDetected, proceedFromIdentify, capturePortraitAndNext,
    handleResolveIdQr, resetForm, onCheckIn, onReject,
    vehicleTypeMismatch,
  };
}

// Kiểu view-model của màn check-in — dùng cho các component con nhận nguyên `ops`.
export type StaffOperations = ReturnType<typeof useStaffOperations>;
