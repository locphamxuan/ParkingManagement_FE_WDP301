import { useEffect, useMemo, useState, useCallback } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Bike,
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Timer,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { ParkingMap2D } from '@/components/map/ParkingMap2D';
import { useAuth } from '@/hooks/useAuth';
import { CustomSelect } from '@/components/ui/select';
import {
  userApi,
  type Building,
  type VehicleType,
  type ParkingSlot as ApiParkingSlot,
  type FloorAvailability,
  type LongTermPackage,
  type Reservation,
  type LongTermSubscription,
} from '@/services/user/userApi';

import {
  type BookingMode,
  type VehicleKind,
  fmtMoney,
  fmtTime,
  fmtShort,
  isSameDay,
  normalizeVehicleTypeCode,
  isCarPackage,
  getMaxCalendarDate,
  packageCategory,
  categoryLabels,
  categoryColors,
} from '@/pages/user/reservationsHelper';

import { MiniCalendar } from '@/components/user/MiniCalendar';
import { TimeScroller } from '@/components/user/TimeScroller';
import { DurationSelector } from '@/components/user/DurationSelector';
import { PackageCard } from '@/components/user/PackageCard';
import { ReservationHistoryTab } from '@/components/user/ReservationHistoryTab';
import { SlotSelectionModal } from '@/components/user/SlotSelectionModal';
import { BookingNotificationModal } from '@/components/user/BookingNotificationModal';
import { BookingSummarySidebar } from '@/components/user/BookingSummarySidebar';

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface ReservationLocationState {
  buildingId?: string;
  plateNumber?: string;
  openHistory?: boolean;
  mode?: BookingMode;
}

interface MappedSlot {
  _id: string;
  buildingId: string;
  code: string;
  floorCode?: string;
  vehicleType: VehicleKind | 'all';
  reservable: boolean;
  status: string;
}

/* ─── Main ReservationsPage ────────────────────────────────────────────────── */

/* ─── Main ReservationsPage ────────────────────────────────────────────────── */

export default function ReservationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const state = (location.state as ReservationLocationState | null) ?? null;

  const user = useMemo(() => {
    if (!session) return null;
    return { userId: session.userId, fullName: session.displayName, licensePlates: session.licensePlates || [] };
  }, [session]);

  /* ── Core state ── */
  const [mode, setMode] = useState<BookingMode>(state?.mode || 'hourly');
  const [rows, setRows] = useState<Array<{ building: Building }>>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [vehicleTypesForBuilding, setVehicleTypesForBuilding] = useState<VehicleType[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleKind | ''>('');
  const [floorsData, setFloorsData] = useState<FloorAvailability[]>([]);
  const [floorsError, setFloorsError] = useState<string>('');
  const [slots, setSlots] = useState<MappedSlot[]>([]);
  const [selectedFloorIdModal, setSelectedFloorIdModal] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPlate, setSelectedPlate] = useState('');

  /* ── Hourly state ── */
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [durationHours, setDurationHours] = useState(2);

  /* ── Package state ── */
  const [packages, setPackages] = useState<LongTermPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<LongTermPackage | null>(null);
  const [pkgStartDate, setPkgStartDate] = useState<Date | null>(null);

  /* ── UI state ── */
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Auto-dismiss alerts after 10 seconds
  useEffect(() => {
    if (bookingSuccess) {
      const timer = setTimeout(() => setBookingSuccess(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [bookingSuccess]);

  useEffect(() => {
    if (bookingError) {
      const timer = setTimeout(() => setBookingError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [bookingError]);

  const [bookedPlates, setBookedPlates] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch reservations
    const p1 = userApi.reservations.list({ limit: 100 }).then(res => {
      const items = (res as any)?.data?.items || [];
      return items
        .filter((r: any) => ['pending', 'confirmed', 'checked_in'].includes(r.status))
        .map((r: any) => r.plateNumber);
    }).catch(() => []);

    // Fetch subscriptions
    const p2 = userApi.longTermSubscriptions.list({ limit: 100 }).then(res => {
      const items = (res as any)?.data?.items || [];
      return items
        .filter((s: any) => ['pending', 'active'].includes(s.status))
        .map((s: any) => s.plateNumber || s.linkedPlates?.[0]);
    }).catch(() => []);

    Promise.all([p1, p2]).then(([resPlates, subPlates]) => {
      const allBooked = Array.from(new Set([
        ...resPlates.filter(Boolean),
        ...subPlates.filter(Boolean)
      ]));
      setBookedPlates(allBooked);
    });
  }, [user, bookingSuccess]);

  /* ── Data Loading ── */
  useEffect(() => {
    let ignore = false;
    setIsLoadingBuildings(true);
    userApi.buildings.list()
      .then((res) => {
        if (ignore) return;
        const buildingRows = res.data.items.map((b) => ({ building: b }));
        setRows(buildingRows);
        const preferred = state?.buildingId || buildingRows[0]?.building._id || '';
        setSelectedBuildingId((c) => c || preferred);
      })
      .catch(() => { })
      .finally(() => { if (!ignore) setIsLoadingBuildings(false); });
    return () => { ignore = true; };
  }, [state?.buildingId]);

  // Set plate from navigation state
  useEffect(() => {
    if (state?.plateNumber) setSelectedPlate(state.plateNumber);
  }, [state?.plateNumber]);

  // Set history mode
  useEffect(() => {
    if (state?.openHistory) setShowHistory(true);
  }, [state?.openHistory]);

  // Load vehicle types + floors for selected building
  useEffect(() => {
    let ignore = false;
    if (!selectedBuildingId) { setFloorsData([]); setVehicleTypesForBuilding([]); setFloorsError(''); return; }

    const load = async () => {
      try {
        setFloorsError('');
        const vtRes = await userApi.buildings.vehicleTypes(selectedBuildingId);
        if (ignore) return;
        setVehicleTypesForBuilding(vtRes.data.items || []);

        const floorsRes = await userApi.buildings.floors(selectedBuildingId);
        if (ignore) return;
        setFloorsData(floorsRes.data.floors || []);
      } catch (err) {
        if (!ignore) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error('Error loading floors:', errorMsg, err);
          setFloorsError(`Lỗi tải tầng: ${errorMsg}`);
          setFloorsData([]);
        }
      }
    };
    load();
    return () => { ignore = true; };
  }, [selectedBuildingId]);

  // Load packages for selected building
  useEffect(() => {
    if (!selectedBuildingId) { setPackages([]); return; }
    let ignore = false;
    userApi.longTermPackages.list({ buildingId: selectedBuildingId })
      .then((res) => {
        if (ignore) return;
        setPackages((res as any)?.data?.packages ?? []);
      })
      .catch(() => { });
    return () => { ignore = true; };
  }, [selectedBuildingId]);

  // Load slots when floor is selected in modal
  useEffect(() => {
    let ignore = false;
    if (!selectedBuildingId || !selectedFloorIdModal) return;
    setIsLoadingSlots(true);
    userApi.buildings.slots(selectedBuildingId, selectedFloorIdModal)
      .then((slotsRes) => {
        if (ignore) return;
        const apiSlots: ApiParkingSlot[] = slotsRes.data.slots || [];
        const mapped: MappedSlot[] = apiSlots.map((s) => {
          let rawCode: string | undefined;
          if (s.vehicleType && typeof s.vehicleType === 'object' && 'code' in s.vehicleType) {
            rawCode = String(s.vehicleType.code);
          }
          return {
            _id: s._id,
            buildingId: selectedBuildingId,
            code: s.code,
            vehicleType: normalizeVehicleTypeCode(rawCode),
            reservable: s.reservable ?? true,
            status: (s.status as string) || 'available',
          };
        });
        setSlots(mapped);
        setSelectedSlot(null);
      })
      .catch(() => { })
      .finally(() => { if (!ignore) setIsLoadingSlots(false); });
    return () => { ignore = true; };
  }, [selectedBuildingId, selectedFloorIdModal]);

  /* ── Derived values ── */
  const selectedBuilding = useMemo(
    () => rows.find((r) => r.building._id === selectedBuildingId) || null,
    [rows, selectedBuildingId],
  );

  const maxCalDate = useMemo(() => getMaxCalendarDate(mode, selectedPkg), [mode, selectedPkg]);

  const startDateTime = useMemo(() => {
    if (mode === 'hourly') {
      if (!selectedDate) return null;
      const [h, m] = selectedTime.split(':').map(Number);
      const d = new Date(selectedDate);
      d.setHours(h, m, 0, 0);
      return d;
    }
    // Package mode: use start of day (00:00) — no specific time needed
    if (!pkgStartDate) return null;
    const d = new Date(pkgStartDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [mode, selectedDate, selectedTime, pkgStartDate]);

  const endDateTime = useMemo(() => {
    if (mode === 'hourly') {
      if (!startDateTime) return null;
      return new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);
    }
    if (startDateTime && selectedPkg) {
      return new Date(startDateTime.getTime() + selectedPkg.durationDays * 24 * 60 * 60 * 1000);
    }
    return null;
  }, [mode, startDateTime, durationHours, selectedPkg]);

  const estimatedAmount = useMemo(() => {
    if (mode === 'package' && selectedPkg) return selectedPkg.price;
    // Rough estimate for hourly — will be replaced by API estimate
    const building = selectedBuilding?.building;
    if (!building?.pricing?.hourlyRate) return 0;
    const rate = selectedVehicleType === 'motorcycle'
      ? building.pricing.hourlyRate * (building.pricing.motorcycleMultiplier || 0.5)
      : building.pricing.hourlyRate;
    return Math.ceil(rate * durationHours);
  }, [mode, selectedPkg, selectedBuilding, selectedVehicleType, durationHours]);

  const filteredPackages = useMemo(() => {
    if (!selectedVehicleType) return packages;
    return packages.filter((pkg) => {
      const isCar = isCarPackage(pkg);
      return selectedVehicleType === 'car' ? isCar : !isCar;
    });
  }, [packages, selectedVehicleType]);

  const plateOptions = useMemo(() => {
    if (!user) return [];
    const base = selectedVehicleType
      ? user.licensePlates.filter((p) => {
        const t = p.vehicleType?.toLowerCase();
        if (selectedVehicleType === 'motorcycle') return t === 'motorcycle' || t === 'bike';
        return t !== 'motorcycle' && t !== 'bike';
      })
      : user.licensePlates;
    return base.filter((p) => !bookedPlates.includes(p.plateNumber));
  }, [user, selectedVehicleType, bookedPlates]);

  const unavailableSlotCodes = useMemo(() => {
    return slots.filter((s) => {
      if (s.status !== 'available') return true;
      if (!s.reservable) return true;
      return false;
    }).map((s) => s.code);
  }, [slots]);

  const unsupportedSlotCodes = useMemo(() => {
    if (!selectedVehicleType) return [];
    return slots.filter((s) => {
      if (s.status !== 'available') return false;
      if (!s.reservable) return false;

      // Prefix check: C for Car, M for Motorcycle
      const firstChar = String(s.code).trim().charAt(0).toUpperCase();
      if (selectedVehicleType === 'car' && firstChar === 'M') {
        return true; // Motorcycle slot is unsupported for Cars
      }
      if (selectedVehicleType === 'motorcycle' && firstChar === 'C') {
        return true; // Car slot is unsupported for Motorcycles
      }

      return s.vehicleType !== 'all' && s.vehicleType !== selectedVehicleType;
    }).map((s) => s.code);
  }, [slots, selectedVehicleType]);

  const selectedFloorInfo = useMemo(() => floorsData.find((f) => f._id === selectedFloorIdModal) || null, [floorsData, selectedFloorIdModal]);

  const canSubmit = Boolean(
    selectedBuildingId && selectedSlot && selectedPlate && startDateTime && endDateTime && !isSubmitting
  );

  /* ── Handlers ── */
  const handleBuildingChange = (id: string) => {
    setSelectedBuildingId(id);
    setSelectedSlot(null);
    setSelectedPlate('');
    setBookingError(null);
    setBookingSuccess(null);
    setSelectedPkg(null);
  };

  const handleSlotClick = (code: string) => {
    if (unavailableSlotCodes.includes(code)) return;
    if (unsupportedSlotCodes.includes(code)) return;
    setSelectedSlot(code);
    setBookingError(null);
    // Auto-select first available plate
    if (!selectedPlate && plateOptions.length > 0) {
      setSelectedPlate(plateOptions[0].plateNumber);
    }
  };

  const handleConfirmBooking = async () => {
    setBookingError(null);
    setBookingSuccess(null);
    if (!startDateTime || !endDateTime || !selectedPlate || !selectedBuildingId) return;

    if (mode === 'hourly') {
      if (startDateTime.getTime() < Date.now() - 5 * 60 * 1000) {
        setBookingError('Thời gian nhận bãi không được ở trong quá khứ. Vui lòng chọn thời gian khác.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'hourly') {
        // Find vehicleTypeId from building's vehicle types
        const vt = vehicleTypesForBuilding.find((v) => {
          const c = (v.code || v.name || '').toLowerCase();
          if (selectedVehicleType === 'motorcycle') return /motor|xe|máy|bike|moto/i.test(c);
          return /car|oto|ô t|auto/i.test(c);
        });

        // Find the slot's _id
        const slotRecord = slots.find((s) => s.code === selectedSlot);

        await userApi.reservations.create({
          buildingId: selectedBuildingId,
          plateNumber: selectedPlate,
          vehicleTypeId: vt?._id,
          vehicleType: selectedVehicleType || undefined,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          slotId: slotRecord?._id,
        });
        setBookingSuccess(`Đặt chỗ thành công! Ô ${selectedSlot} từ ${fmtShort(startDateTime)} đến ${fmtShort(endDateTime)}`);
      } else if (selectedPkg) {
        const res = await userApi.longTermSubscriptions.create({
          packageId: selectedPkg._id,
          plateNumber: selectedPlate,
          slotId: slots.find((s) => s.code === selectedSlot)?._id,
          startDate: startDateTime.toISOString(),
        });
        const data = (res as any)?.data;
        if (data?.checkoutUrl) {
          setBookingSuccess('Chuyển hướng đến cổng thanh toán PayOS...');
          window.location.href = data.checkoutUrl;
        } else {
          setBookingSuccess(`Đăng ký gói "${selectedPkg.name}" thành công!`);
        }
      }
      setSelectedSlot(null);
      setShowSlotModal(false);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Không thể hoàn tất đặt chỗ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session || !user) return <Navigate to="/auth/login" replace />;

  const isStep1Complete = !!selectedBuildingId && !!selectedVehicleType && !!selectedPlate;
  const isStep2Complete = mode === 'hourly'
    ? !!selectedDate
    : !!selectedPkg && !!pkgStartDate;
  const isStep3Complete = !!selectedSlot;
  const activeStep = !isStep1Complete ? 1 : !isStep2Complete ? 2 : 3;

  /* ── Render ── */
  return (
    <main className="min-h-screen bg-[#060a11] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-orange-400 font-mono bg-orange-500/10 px-2.5 py-0.5 rounded border border-orange-500/20">Hệ thống Đặt chỗ</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-slate-500 font-mono">LIVE SLOTS AVAILABLE</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">Đăng Ký Đỗ Xe Thông Minh</h1>
            <p className="text-xs text-slate-400 font-semibold">Đặt chỗ nhanh chóng theo giờ hoặc đăng ký gói dài hạn ưu đãi.</p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-300 shadow-md hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft size={14} className="stroke-[3]" /> Trang chủ
            </button>
            <button type="button" onClick={() => setShowHistory(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-yellow-400 shadow-md hover:border-yellow-400/40 hover:bg-yellow-500/10 hover:text-yellow-300 hover:scale-105 transition-all duration-300"
            >
              <CalendarClock size={14} className="stroke-[2.5]" /> Lịch sử đặt chỗ
            </button>
          </div>
        </motion.div>

        {/* ── Tab Bar ── */}
        <div className="mb-8 flex max-w-[480px] mx-auto items-center gap-2 rounded-2xl border border-white/5 bg-slate-950/40 backdrop-blur-md p-1.5">
          {[
            { key: 'hourly' as BookingMode, label: 'Đặt theo giờ', icon: <Timer size={14} /> },
            { key: 'package' as BookingMode, label: 'Đăng ký gói dài hạn', icon: <Package size={14} /> },
          ].map((tab) => {
            const isActive = mode === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setMode(tab.key);
                  setSelectedSlot(null);
                  setBookingError(null);
                  setBookingSuccess(null);
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all duration-300 relative ${
                  isActive
                    ? 'text-slate-950 bg-gradient-to-r from-orange-500 via-amber-400 to-amber-500 shadow-[0_0_20px_rgba(249,115,22,0.35)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Main Wizard ── */}
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Left: Stepper Booking Form */}
          <div className="relative pl-8 md:pl-10 space-y-6">
            {/* Stepper Vertical Progress Line */}
            <div className="absolute left-[15px] md:left-[19px] top-6 bottom-6 w-[2px] bg-slate-800 pointer-events-none">
              <div 
                className="w-full bg-gradient-to-b from-cyan-500 via-orange-500 to-emerald-500 transition-all duration-500" 
                style={{ 
                  height: isStep1Complete && isStep2Complete ? '100%' : isStep1Complete ? '50%' : '0%' 
                }} 
              />
            </div>

            {/* STEP 1: THÔNG TIN PHƯƠNG TIỆN */}
            <div className="relative group">
              {/* Step indicator circle */}
              <div className={`absolute -left-[31px] md:-left-[35px] top-2 w-8 h-8 rounded-full border flex items-center justify-center font-mono font-black text-xs transition-all duration-300 z-10 ${
                isStep1Complete
                  ? 'border-emerald-500 bg-emerald-950/80 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : activeStep === 1
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] scale-110'
                    : 'border-slate-800 bg-slate-950 text-slate-500'
              }`}>
                {isStep1Complete ? '✓' : '01'}
              </div>

              {/* Step Card */}
              <div className={`rounded-3xl border p-6 transition-all duration-300 ${
                activeStep === 1 
                  ? 'border-cyan-500/20 bg-slate-900/40 shadow-[0_10px_30px_rgba(6,182,212,0.05)]' 
                  : isStep1Complete 
                    ? 'border-emerald-500/10 bg-slate-950/20 opacity-90'
                    : 'border-white/[0.04] bg-white/[0.01] opacity-60'
              }`}>
                <div className="flex items-center gap-2.5 mb-5">
                  <Building2 size={16} className={isStep1Complete ? 'text-emerald-400' : 'text-cyan-400'} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Thông tin cơ bản & xe gửi</h3>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Tòa nhà</label>
                    <CustomSelect
                      value={selectedBuildingId}
                      onChange={handleBuildingChange}
                      options={[
                        { value: '', label: '-- Chọn tòa nhà --' },
                        ...rows.map((r) => ({ value: r.building._id, label: r.building.name })),
                      ]}
                      placeholder="-- Chọn tòa nhà --"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Loại xe</label>
                    <CustomSelect
                      value={selectedVehicleType}
                      onChange={(val) => {
                        setSelectedVehicleType(val as VehicleKind | '');
                        setSelectedSlot(null);
                        setSelectedPlate('');
                        setSelectedPkg(null);
                      }}
                      options={[
                        { value: '', label: '-- Chọn loại xe --' },
                        { value: 'car', label: '🚗 Ô tô' },
                        { value: 'motorcycle', label: '🏍️ Xe máy' },
                      ]}
                      placeholder="-- Chọn loại xe --"
                    />
                  </div>
                </div>

                {/* Plate selection */}
                <div className="mt-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={14} className="text-amber-400" />
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Biển số xe đăng ký</label>
                  </div>
                  <CustomSelect
                    value={selectedPlate}
                    onChange={setSelectedPlate}
                    disabled={plateOptions.length === 0}
                    options={[
                      { value: '', label: plateOptions.length === 0 ? '-- Tất cả biển số xe phù hợp đều đã đặt chỗ --' : '-- Chọn biển số --' },
                      ...plateOptions.map((p) => ({
                        value: p.plateNumber,
                        label: `${p.plateNumber} — ${p.vehicleType === 'motorcycle' ? '🏍️ Xe máy' : '🚗 Ô tô'}`,
                      })),
                    ]}
                    placeholder="-- Chọn biển số --"
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: THỜI GIAN ĐẶT CHỖ / GÓI DÀI HẠN */}
            <div className="relative group">
              {/* Step indicator circle */}
              <div className={`absolute -left-[31px] md:-left-[35px] top-2 w-8 h-8 rounded-full border flex items-center justify-center font-mono font-black text-xs transition-all duration-300 z-10 ${
                isStep2Complete
                  ? 'border-emerald-500 bg-emerald-950/80 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : activeStep === 2
                    ? 'border-orange-500 bg-orange-950/80 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)] scale-110'
                    : 'border-slate-800 bg-slate-950 text-slate-500'
              }`}>
                {isStep2Complete ? '✓' : '02'}
              </div>

              {/* Step Card */}
              <div className={`rounded-3xl border p-6 transition-all duration-300 ${
                activeStep === 2 
                  ? 'border-orange-500/20 bg-slate-900/40 shadow-[0_10px_30px_rgba(249,115,22,0.05)]' 
                  : isStep2Complete 
                    ? 'border-emerald-500/10 bg-slate-950/20 opacity-90'
                    : 'border-white/[0.04] bg-white/[0.01] opacity-60'
              }`}>
                <div className="flex items-center gap-2.5 mb-5">
                  <CalendarClock size={16} className={isStep2Complete ? 'text-emerald-400' : 'text-orange-400'} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">
                    {mode === 'hourly' ? 'Thời gian đỗ xe' : 'Chọn gói gửi dài hạn'}
                  </h3>
                </div>

                {/* ── Hourly Mode ── */}
                <AnimatePresence mode="wait">
                  {mode === 'hourly' && (
                    <motion.div key="hourly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Date */}
                      <div>
                        <span className="mb-3 block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Chọn ngày nhận xe</span>
                        <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} maxDate={maxCalDate} />
                        <p className="mt-2.5 text-[10px] font-bold text-slate-500">
                          * Chỉ hỗ trợ đặt trước tối đa 7 ngày
                        </p>
                      </div>

                      {/* Time */}
                      <div className="border-t border-white/5 pt-5">
                        <span className="mb-3 block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Giờ nhận xe</span>
                        <TimeScroller selected={selectedTime} onSelect={setSelectedTime} />
                      </div>

                      {/* Duration */}
                      <div className="border-t border-white/5 pt-5">
                        <span className="mb-3 block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Số giờ sử dụng</span>
                        <DurationSelector hours={durationHours} onSelect={setDurationHours} />
                      </div>
                    </motion.div>
                  )}

                  {/* ── Package Mode ── */}
                  {mode === 'package' && (
                    <motion.div key="package" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Package Cards */}
                      <div>
                        <span className="mb-3 block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Chọn loại gói</span>

                        {packages.length === 0 ? (
                          <p className="text-xs text-slate-500 font-black py-4 text-center">
                            {isLoadingBuildings ? 'Đang tải gói xe...' : 'Không có gói nào khả dụng cho tòa nhà này.'}
                          </p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {packages.map((pkg) => {
                              const cat = packageCategory(pkg);
                              const colors = categoryColors[cat];
                              const isSelected = selectedPkg?._id === pkg._id;
                              const isCar = isCarPackage(pkg);
                              const isLocked = !!selectedVehicleType && (selectedVehicleType === 'car' ? !isCar : isCar);
                              return (
                                <PackageCard
                                  key={pkg._id}
                                  pkg={pkg}
                                  isSelected={isSelected}
                                  isLocked={isLocked}
                                  cat={cat}
                                  colors={colors}
                                  onClick={() => {
                                    if (isLocked) return;
                                    setSelectedPkg(pkg);
                                    setPkgStartDate(null);
                                    const nextType = isCar ? 'car' : 'motorcycle';
                                    if (selectedVehicleType !== nextType) {
                                      setSelectedVehicleType(nextType);
                                      setSelectedSlot(null);
                                      setSelectedPlate('');
                                    }
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Package Date */}
                      {selectedPkg && (
                        <div className="border-t border-white/5 pt-5">
                          <span className="mb-3 block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Ngày bắt đầu gói gửi xe</span>
                          <MiniCalendar selectedDate={pkgStartDate} onSelect={setPkgStartDate} maxDate={maxCalDate} />
                          <p className="mt-2.5 text-[10px] font-bold text-slate-500">
                            * {selectedPkg.durationDays <= 7
                              ? 'Gói tuần: chọn trong vòng 7 ngày tới'
                              : selectedPkg.durationDays <= 30
                                ? 'Gói tháng: chọn trong tháng này hoặc tháng sau'
                                : 'Gói năm: chọn trong năm nay hoặc năm sau'}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* STEP 3: VỊ TRÍ ĐỖ XE */}
            <div className="relative group">
              {/* Step indicator circle */}
              <div className={`absolute -left-[31px] md:-left-[35px] top-2 w-8 h-8 rounded-full border flex items-center justify-center font-mono font-black text-xs transition-all duration-300 z-10 ${
                isStep3Complete
                  ? 'border-emerald-500 bg-emerald-950/80 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : activeStep === 3
                    ? 'border-cyan-500 bg-cyan-950/80 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] scale-110'
                    : 'border-slate-800 bg-slate-950 text-slate-500'
              }`}>
                {isStep3Complete ? '✓' : '03'}
              </div>

              {/* Step Card */}
              <div className={`rounded-3xl border p-6 transition-all duration-300 ${
                activeStep === 3 
                  ? 'border-cyan-500/20 bg-slate-900/40 shadow-[0_10px_30px_rgba(6,182,212,0.05)]' 
                  : isStep3Complete 
                    ? 'border-emerald-500/10 bg-slate-950/20 opacity-90'
                    : 'border-white/[0.04] bg-white/[0.01] opacity-60'
              }`}>
                <div className="flex items-center gap-2.5 mb-5">
                  <MapPin size={16} className={isStep3Complete ? 'text-emerald-400' : 'text-cyan-400'} />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-200">Chọn vị trí ô đỗ</h3>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <motion.button
                    type="button"
                    onClick={() => setShowSlotModal(true)}
                    disabled={!selectedBuildingId}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-teal-500/5 px-5 py-4 text-xs font-black uppercase tracking-widest text-cyan-300 transition-all hover:from-cyan-500/25 hover:to-teal-500/15 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500 disabled:bg-none"
                  >
                    <MapPin size={14} className="stroke-[2.5]" /> Chọn ô đỗ trên bản đồ
                  </motion.button>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/50 px-5 py-3.5 text-center min-w-[120px] flex flex-col justify-center shadow-inner">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">Ô đỗ đã chọn</p>
                    <p className="mt-1 font-mono text-2xl font-black text-orange-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.3)]">{selectedSlot || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Right: Summary Sidebar */}
          <BookingSummarySidebar
            selectedBuildingName={selectedBuilding?.building.name}
            mode={mode}
            selectedPkgName={selectedPkg?.name}
            selectedVehicleType={selectedVehicleType}
            selectedSlot={selectedSlot}
            selectedPlate={selectedPlate}
            startDateTime={startDateTime}
            endDateTime={endDateTime}
            estimatedAmount={estimatedAmount}
          />
        </div>

        {/* ── Sticky Footer ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#060a11]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="hidden text-xs font-semibold text-slate-400 sm:block">
              {startDateTime && endDateTime ? (
                <>
                  <span className="text-white">Nhận bãi:</span> {fmtShort(startDateTime)}
                  <span className="mx-2 text-slate-600">—</span>
                  <span className="text-white">Trả bãi:</span> {fmtShort(endDateTime)}
                  <span className="mx-2 text-slate-600">|</span>
                  <span className="text-emerald-300 font-black">{fmtMoney(estimatedAmount)}</span>
                </>
              ) : (
                'Chọn thời gian và chỗ đỗ để đặt chỗ'
              )}
            </div>
            <motion.button
              type="button"
              disabled={!canSubmit}
              onClick={handleConfirmBooking}
              whileHover={canSubmit ? { scale: 1.02 } : {}}
              whileTap={canSubmit ? { scale: 0.98 } : {}}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_24px_rgba(249,115,22,0.3)] transition-all disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              <ShieldCheck size={16} />
              {isSubmitting ? 'Đang xử lý...' : mode === 'hourly' ? 'Xác nhận đặt chỗ' : 'Mua gói'}
            </motion.button>
          </div>
        </div>

        {/* Extra bottom padding for sticky footer */}
        <div className="h-20" />
      </div>

      {/* ── Slot Selection Modal ── */}
      <SlotSelectionModal
        isOpen={showSlotModal}
        onClose={() => setShowSlotModal(false)}
        selectedFloorIdModal={selectedFloorIdModal}
        setSelectedFloorIdModal={setSelectedFloorIdModal}
        slots={slots}
        selectedSlot={selectedSlot}
        setSelectedSlot={setSelectedSlot}
        unavailableSlotCodes={unavailableSlotCodes}
        unsupportedSlotCodes={unsupportedSlotCodes}
        onSlotClick={handleSlotClick}
        isLoadingSlots={isLoadingSlots}
        floorsError={floorsError}
        floorsData={floorsData}
        selectedVehicleType={selectedVehicleType}
      />

      {/* ── History Modal ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setShowHistory(false)}
          >
            {/* Background glowing flare */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_0_80px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col"
            >
              {/* Modal Header */}
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-orange-500/10 p-2 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                    <CalendarClock size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-wide">Lịch sử đặt chỗ</h2>
                    <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">Theo dõi & Quản lý các lượt đỗ xe</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="rounded-full border border-white/5 bg-white/[0.02] p-2 text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-auto pr-1">
                <ReservationHistoryTab />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Center Notification Popup Modal ── */}
      <BookingNotificationModal
        bookingSuccess={bookingSuccess}
        bookingError={bookingError}
        onCloseSuccess={() => setBookingSuccess(null)}
        onCloseError={() => setBookingError(null)}
      />
    </main>
  );
}
