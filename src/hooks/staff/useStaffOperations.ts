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

  const availableZones = useMemo(() => {
    const zonesMap = new Map<string, { _id: string; code: string; count: number }>();
    freeSlots.forEach((slot) => {
      if (slot.zone && typeof slot.zone === 'object') {
        const existing = zonesMap.get(slot.zone._id);
        if (existing) existing.count += 1;
        else zonesMap.set(slot.zone._id, { ...slot.zone, count: 1 });
      }
    });
    return Array.from(zonesMap.values());
  }, [freeSlots]);

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
      if (detected !== vehicleType) return `Cảnh báo: Biển số có vẻ là ${detected === 'car' ? 'ô tô' : 'xe máy'}, nhưng bạn chọn ${vehicleType === 'car' ? 'ô tô' : 'xe máy'}.`;
    }
    return null;
  }, [plateNumber, vehicleType]);

  const buildingSupportWarning = useMemo(() => {
    if (allowedTypes.length === 0) return null;
    const code = vehicleType === 'car' ? 'CAR' : 'MOTORCYCLE';
    if (!allowedTypes.includes(code))
      return `Tòa nhà này không hỗ trợ loại xe ${vehicleType === 'car' ? 'ô tô' : 'xe máy'}.`;
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

  const hasActivePackage = Boolean(plateAccountInfo?.hasActivePackage);
  const hasActiveReservation = Boolean(plateAccountInfo?.hasActiveReservation);
  const checkInKind: 'package' | 'reservation' | 'standard' = hasActivePackage
    ? 'package'
    : hasActiveReservation
      ? 'reservation'
      : 'standard';
  const needsSlotSelection = hasActivePackage || checkInKind === 'standard';

  useEffect(() => {
    if (!needsSlotSelection || !buildingId) {
      setFreeSlots([]);
      setSelectedSlotId('');
      setSelectedZoneId('');
      return;
    }
    let cancelled = false;
    const usageType = hasActivePackage ? 'subscriber' : 'walk_in';
    staffApi
      .freeSlots(buildingId, { vehicleType, usageType })
      .then((res) => {
        if (!cancelled) setFreeSlots((res as { data?: { items?: typeof freeSlots } })?.data?.items ?? []);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsSlotSelection, buildingId, vehicleType, hasActivePackage]);

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
      setOpMessage({ type: 'err', text: 'Camera chân dung chưa sẵn sàng. Vui lòng thử lại.' });
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
        setOpMessage({ type: 'err', text: 'Không nhận diện được mã QR.' });
        return;
      }
      if (data.kind === 'plate' && data.plate?.plateNumber) {
        if (data.plate.vehicleType === 'motorcycle') setVehicleType('motorcycle');
        else if (data.plate.vehicleType) setVehicleType('car');
        applyPlate(data.plate.plateNumber, data.plate.brand ?? null);
        setOpMessage({ type: 'ok', text: `Đã nhận diện biển số ${data.plate.plateNumber}. Bấm "Tiếp tục".` });
      } else if (data.user) {
        setUserQrInfo({
          fullName: data.user.fullName,
          email: data.user.email,
          walletBalance: data.user.walletBalance,
          activePackages: data.activePackages ?? [],
        });
        setOpMessage({ type: 'ok', text: `Đã nhận diện tài khoản: ${data.user.fullName}. Vui lòng quét/nhập biển số xe.` });
      } else {
        setOpMessage({ type: 'err', text: 'Mã QR không khớp với tài khoản hoặc phương tiện nào.' });
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Lỗi tra cứu mã QR.' });
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
      setOpMessage({ type: 'err', text: 'Xe này có gói dài hạn — vui lòng chọn 1 chỗ đỗ trống trước khi check-in.' });
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
      setOpMessage({ type: 'ok', text: `Đã tạo phiên gửi xe cho biển số ${currentPlate} thành công.` });
      resetForm();
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-in thất bại' });
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
        text: `Đã từ chối cho xe vào biển ${plate}.${notified ? ' Đã gửi thông báo cho khách.' : ' (Biển chưa có tài khoản nên không gửi được thông báo.)'}`,
      });
      setRejectOpen(false);
      setRejectReason('');
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Từ chối thất bại' });
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
