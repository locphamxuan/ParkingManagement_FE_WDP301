import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCcw, ScanLine, QrCode, Loader2, AlertCircle, Sparkles, UserPlus, Car, Bike } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';
import { AIAutoScanZone } from '@/components/staff/AIAutoScanZone';
import { QRCodeScannerModal } from '@/components/staff/QRCodeScannerModal';
import { api } from '@/services/apiClient';

const USE_MOCK = (import.meta.env.VITE_USE_MOCK_DATA as string | undefined) !== 'false';

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
    if (USE_MOCK) {
      setAllowedTypes(['CAR', 'MOTORCYCLE']);
      setBuildingFloors([]);
      return;
    }
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

  // VN License Plate formatting Regex and cleaner
  const cleanOcrText = (rawText: string): string => {
    const upperText = rawText.toUpperCase().trim();

    const correctOcrDigits = (suffix: string): string => {
      let corrected = '';
      for (let i = 0; i < suffix.length; i++) {
        const char = suffix[i];
        if (/[0-9]/.test(char)) {
          corrected += char;
        } else {
          if (char === 'S') {
            const prev = i > 0 ? suffix[i - 1] : '';
            const next = i < suffix.length - 1 ? suffix[i + 1] : '';
            if (prev === '8') {
              corrected += '9'; // 8S -> 89
            } else if (prev === '5') {
              corrected += '6'; // 5S -> 56
            } else if (next === '7') {
              corrected += '6'; // S7 -> 67
            } else {
              corrected += '5'; // default S -> 5
            }
          } else if (char === 'B') {
            corrected += '8';
          } else if (char === 'O' || char === 'D' || char === 'Q') {
            corrected += '0';
          } else if (char === 'I' || char === 'T' || char === 'J' || char === 'L') {
            corrected += '1';
          } else if (char === 'Z') {
            corrected += '2';
          } else if (char === 'A') {
            corrected += '4';
          } else if (char === 'G') {
            corrected += '6';
          } else {
            corrected += '0';
          }
        }
      }
      return corrected;
    };
    
    // Replace all non-alphanumeric character sequences with a single space
    const normalizedSpaces = upperText.replace(/[^A-Z0-9]+/g, ' ');
    const parts = normalizedSpaces.split(' ').filter(p => p.length > 0);
    
    if (parts.length >= 2) {
      const part1 = parts[0];
      const suffixParts = parts.slice(1);
      const cleanSuffixParts = suffixParts.map(p => correctOcrDigits(p));
      
      if (cleanSuffixParts.length === 2) {
        const s1 = cleanSuffixParts[0];
        const s2 = cleanSuffixParts[1];
        if (s1.length === 3 && s2.length === 2) {
          return `${part1}-${s1}.${s2}`;
        }
      }
      
      const combinedSuffix = cleanSuffixParts.join('');
      if (combinedSuffix.length === 5) {
        return `${part1}-${combinedSuffix.substring(0, 3)}.${combinedSuffix.substring(3)}`;
      } else if (combinedSuffix.length === 4) {
        return `${part1}-${combinedSuffix}`;
      }
    }

    // Double fallback: regex-based
    const pattern = /(\d{2}[^A-Z0-9]*[A-Z]{1,2}\d{0,2})[\s\-_.]*(\d{3}[\s\-_.]*\d{2}|\d{3,5})/g;
    const match = pattern.exec(upperText);
    if (match) {
      const part1 = match[1].replace(/[^A-Z0-9]/g, '');
      const part2 = correctOcrDigits(match[2].replace(/[^A-Z0-9]/g, ''));
      
      let formattedPart2 = part2;
      if (part2.length === 5) {
        formattedPart2 = part2.substring(0, 3) + '.' + part2.substring(3);
      }
      
      return `${part1}-${formattedPart2}`;
    }
    
    const clean = upperText.replace(/[^A-Z0-9]/g, '');
    return clean.substring(0, 12);
  };

  const startWebcam = async () => {
    setIsScanning(true);
    setOcrError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
      streamRef.current = mediaStream;
    } catch (err) {
      console.error('Failed to start webcam:', err);
      setOcrError('Không thể khởi động Webcam. Vui lòng cấp quyền truy cập camera.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const performOcr = async (base64String: string) => {
    setIsOcrLoading(true);
    setOcrError(null);
    try {
      const formData = new FormData();
      formData.append('apikey', 'K87161803788957');
      formData.append('base64Image', base64String);
      formData.append('language', 'eng');
      formData.append('isOverlayRequired', 'false');

      const res = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error(`OCR Space API trả về mã lỗi: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage?.[0] || 'Lỗi nhận diện OCR.');
      }

      const parsedText = data.ParsedResults?.[0]?.ParsedText;
      if (!parsedText || !parsedText.trim()) {
        throw new Error('Không nhận diện được chữ. Vui lòng thử lại với ảnh rõ nét hơn.');
      }

      const cleaned = cleanOcrText(parsedText);
      if (!cleaned) {
        throw new Error('Không trích xuất được biển số xe hợp lệ.');
      }

      setPlateNumber(cleaned);
      setOpMessage({ type: 'ok', text: `Nhận diện biển số thành công: ${cleaned}` });

      if (activeForm === 'check-out') {
        const matched = sessions.find(
          (s) => s.status === 'active' && s.plateNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleaned.replace(/[^A-Z0-9]/g, '')
        );
        if (matched) {
          setSelectedSessionId(matched._id);
          setOpMessage({ type: 'ok', text: `Nhận diện biển số thành công: ${cleaned} (Đã khớp với phiên đang đỗ)` });
        } else {
          setOpMessage({ type: 'err', text: `Nhận diện biển số thành công: ${cleaned} (Nhưng không tìm thấy phiên đang đỗ trùng khớp)` });
        }
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setOcrError(err instanceof Error ? err.message : 'Lỗi nhận diện biển số xe.');
    } finally {
      setIsOcrLoading(false);
    }
  };

  const captureFrameAndScan = async () => {
    if (!videoRef.current) return;
    setIsOcrLoading(true);
    setOcrError(null);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64String = canvas.toDataURL('image/jpeg', 0.85);
        
        stopWebcam();
        await performOcr(base64String);
      }
    } catch (err) {
      setOcrError(err instanceof Error ? err.message : 'Lỗi khi chụp hình từ Webcam.');
      setIsOcrLoading(false);
    }
  };

  const handleImageUpload = (file: File) => {
    if (!file) return;
    setIsOcrLoading(true);
    setOcrError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      performOcr(base64String);
    };
    reader.onerror = () => {
      setOcrError('Không thể đọc file ảnh.');
      setIsOcrLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleLprScanSuccess = (plate: string) => {
    setPlateNumber(plate);
    setOpMessage({ type: 'ok', text: `Nhận diện biển số thành công: ${plate}` });

    if (activeForm === 'check-out') {
      const matched = sessions.find(
        (s) => s.status === 'active' && s.plateNumber.toUpperCase().replace(/[^A-Z0-9]/g, '') === plate.replace(/[^A-Z0-9]/g, '')
      );
      if (matched) {
        setSelectedSessionId(matched._id);
        setOpMessage({ type: 'ok', text: `Nhận diện biển số thành công: ${plate} (Đã khớp với phiên đang đỗ)` });
      } else {
        setOpMessage({ type: 'err', text: `Nhận diện biển số thành công: ${plate} (Nhưng không tìm thấy phiên đang đỗ trùng khớp)` });
      }
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
        setBindingError('Không tìm thấy tài khoản khách hàng nào khớp với thông tin nhập.');
      }
    } catch (err) {
      setBindingError(err instanceof Error ? err.message : 'Lỗi truy vấn khách hàng.');
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
        text: `Đã liên kết biển số xe ${scannedPlateForBinding} vào tài khoản khách hàng ${foundCustomer.fullName} thành công!`,
      });
      
      setPlateAccountInfo({
        hasAccount: true,
        user: foundCustomer,
      });
      
      setIsBindingModalOpen(false);
      setCustomerIdOrEmail('');
      setFoundCustomer(null);
    } catch (err) {
      setBindingError(err instanceof Error ? err.message : 'Lỗi liên kết biển số.');
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

  const columns: DataColumn<ParkingSession>[] = [
    { key: 'plateNumber', title: 'Plate' },
    {
      key: 'vehicleType',
      title: 'Vehicle Type',
      render: (row) => (row.vehicleType ? `${row.vehicleType.name} (${row.vehicleType.code})` : '—'),
    },
    {
      key: 'floor',
      title: 'Floor',
      render: (row) => (row as any).slot?.floor?.name ?? '—',
    },
    {
      key: 'slot',
      title: 'Slot',
      render: (row) => (row as any).slot?.code ?? '—',
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
    const currentPlate = plateNumber.trim().toUpperCase();
    const shouldPrompt = plateAccountInfo && !plateAccountInfo.hasAccount;

    try {
      await staffApi.checkIn({
        plateNumber: currentPlate,
        vehicleType: vehicleType === 'motorcycle' ? 'motorcycle' : 'car',
        gate: gate.trim() || undefined,
        building: buildingId || undefined,
      });
      setOpMessage({ type: 'ok', text: `Đã tạo phiên gửi xe thành công cho biển số ${currentPlate}.` });
      setPlateNumber('');
      setGate('');
      setActiveForm('check-out');
      setReloadTick((n) => n + 1);

      if (shouldPrompt) {
        setPlateToPromptBinding(currentPlate);
      }
    } catch (err) {
      setOpMessage({ type: 'err', text: err instanceof Error ? err.message : 'Check-in thất bại' });
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
                            Khách hàng thành viên: <strong className="text-white">{plateAccountInfo.user?.fullName}</strong> ({plateAccountInfo.user?.email || 'Không có email'})
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
                              Biển số <strong className="text-white">{plateNumber.toUpperCase()}</strong> chưa liên kết với tài khoản thành viên nào.
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
                            Liên Kết Tài Khoản Khách
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-1.5">
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
                    <div className="grid gap-1.5">
                      <label className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Entry Gate <span className="text-orange-400 font-bold">*</span>
                      </label>
                      <Input
                        value={gate}
                        onChange={(e) => setGate(e.target.value)}
                        placeholder="Gate A (e.g. CV_T1)"
                        className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                      />
                      {!gate.trim() && (
                        <span className="text-[10px] text-amber-400">
                          Vui lòng điền cổng vào để check-in.
                        </span>
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
                  disabled={!plateNumber.trim() || !gate.trim() || loading || !!buildingSupportWarning || !!plateTypeWarning}
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
                  <QrCode size={14} /> Quét QR
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
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{s.plateNumber}</p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {s.entryGate?.code ?? '—'} ·{' '}
                      {s.vehicleType ? `${s.vehicleType.name}` : '—'}
                      {(s as any).slot?.floor?.name ? ` · ${(s as any).slot.floor.name}` : ''}
                      {(s as any).slot?.code ? ` (${(s as any).slot.code})` : ''}
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

      {/* QR Scanner Modal */}
      <QRCodeScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSuccess={(code) => {
          setReservationCode(code);
          setOpMessage({ type: 'ok', text: `Đã quét thành công mã QR đặt chỗ: ${code}` });
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
                <h3 className="text-xl font-semibold text-white">Liên Kết Biển Số</h3>
              </div>
              <button
                onClick={() => { setIsBindingModalOpen(false); setCustomerIdOrEmail(''); setFoundCustomer(null); setBindingError(null); }}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Bạn đang thực hiện liên kết biển số xe <strong className="text-orange-300 font-mono text-sm">{scannedPlateForBinding}</strong> vào tài khoản thành viên của khách hàng.
            </p>

            <div className="space-y-4">
              <div className="grid gap-1.5">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">ID / Email / QR Code Khách</label>
                <div className="flex gap-2">
                  <Input
                    value={customerIdOrEmail}
                    onChange={(e) => setCustomerIdOrEmail(e.target.value)}
                    placeholder="Nhập ID, email hoặc mã QR của khách"
                    className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && handleLookupCustomer()}
                  />
                  <Button
                    type="button"
                    onClick={handleLookupCustomer}
                    disabled={bindingLoading || !customerIdOrEmail.trim()}
                    className="rounded-xl bg-orange-500 text-slate-950 hover:bg-orange-400 shrink-0 text-xs px-4"
                  >
                    Kiểm Tra
                  </Button>
                </div>
              </div>

              {bindingLoading && (
                <div className="flex items-center gap-2 text-xs text-orange-300">
                  <Loader2 className="h-4 w-4 animate-spin animate-infinite" /> Đang xử lý...
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
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Khách hàng thành viên</p>
                  <div className="text-xs space-y-1.5 text-slate-300">
                    <p>Họ tên: <strong className="text-white">{foundCustomer.fullName}</strong></p>
                    <p>Email: <strong className="text-white">{foundCustomer.email}</strong></p>
                  </div>
                  <Button
                    onClick={handleBindPlate}
                    disabled={bindingLoading}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-bold text-xs"
                  >
                    Đồng Ý Liên Kết Biển Số Xe 🎯
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
                Hủy bỏ
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
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-400">Gợi Ý Hệ Thống (AI Suggestion)</p>
                <h3 className="mt-1 text-lg font-bold text-white">Hỏi Khách Hàng Thêm Biển Số</h3>
              </div>
            </div>

            <div className="mt-6 space-y-4 relative z-10">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-center">
                <p className="text-xs text-slate-400">Biển số vừa check-in</p>
                <p className="mt-1 font-mono text-2xl font-black tracking-wider text-orange-300">{plateToPromptBinding}</p>
              </div>

              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-xs font-semibold text-orange-300 mb-1.5 flex items-center gap-1.5">
                  <UserPlus size={14} className="shrink-0" />
                  Bảo vệ gợi ý khách hàng:
                </p>
                <p className="text-sm italic text-slate-200 leading-relaxed">
                  "Dạ thưa anh/chị, biển số này chưa được đăng ký vào tài khoản. Anh/chị có muốn lưu biển số vào tài khoản thành viên để lần sau tự động mở cổng và tích điểm không ạ?"
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
              <Button
                variant="secondary"
                onClick={() => setPlateToPromptBinding(null)}
                className="rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-xs px-4 h-11 transition-all duration-300"
              >
                Không, Bỏ Qua
              </Button>
              <Button
                onClick={() => {
                  setScannedPlateForBinding(plateToPromptBinding);
                  setPlateToPromptBinding(null);
                  setIsBindingModalOpen(true);
                }}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold hover:brightness-110 shadow-lg shadow-orange-500/20 text-xs px-4 h-11 transition-all duration-300 flex items-center justify-center gap-1.5"
              >
                Có, Liên Kết Ngay 🎯
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
