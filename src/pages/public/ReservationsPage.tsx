import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, Plus, X, Calendar, Clock, Car, Bike,
  CheckCircle2, AlertTriangle, Loader2, ShieldAlert, ChevronRight,
  Building2, Layers, ParkingCircle, Wallet, Info,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { requestJson, DEFAULT_API_BASE } from '@/services/pbmsApi';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Building { _id: string; name: string; code: string; address?: { fullAddress?: string } | string; }
interface VehicleType { _id: string; code: string; name: string; }
interface Floor { _id: string; code: string; name: string; availableSlots?: number; totalSlots?: number; }
interface Slot { _id: string; code: string; status: string; }
interface Reservation {
  _id: string; code: string; plateNumber: string;
  building: { name: string }; vehicleType: { name: string };
  slot?: { code: string; floor?: { name: string; code: string } };
  startTime: string; endTime: string;
  fee: number; estimatedFee: number;
  status: string;
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-US') + ' VND';
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// All 30-min time slots for a full day (00:00 – 23:30).
const ALL_TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 30]) {
    ALL_TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${m === 0 ? '00' : '30'}`);
  }
}

// Next 7 days as YYYY-MM-DD strings.
function next7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const navigate = useNavigate();
  const { session, token } = useAuth();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookingFee, setBookingFee] = useState<{ estimatedFee: number; deposit: number; remainingFee: number; hourlyRate: number; hours: number; regularHours: number; peakHours: number; peakRate: number | null } | null>(null);
  const [fetchingFee, setFetchingFee] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const user = session ? {
    userId: session.userId,
    licensePlates: session.licensePlates || [],
  } : null;

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestJson<{ data: { items: Reservation[] } }>({
        path: '/users/reservations',
        token: token ?? undefined,
      });
      setReservations(res.data?.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  // ── Wizard step helpers ───────────────────────────────────────────────────

  const openWizard = async () => {
    setShowWizard(true);
    setStep(1);
    setSelectedBuilding(''); setSelectedVehicleType(''); setSelectedPlate('');
    setSelectedFloor(''); setSelectedSlot('');
    setStartDate(''); setStartTime(''); setEndDate(''); setEndTime('');
    setBookingFee(null);
    setWizardError(null);
    setWizardLoading(true);
    try {
      const res = await requestJson<{ data: { items: Building[] } }>({
        path: '/users/buildings',
        token: token ?? undefined,
      });
      setBuildings(res.data?.items ?? []);
    } catch (e) {
      setWizardError(e instanceof Error ? e.message : 'Failed to load buildings');
    } finally {
      setWizardLoading(false);
    }
  };

  const onBuildingSelect = async (id: string) => {
    setSelectedBuilding(id);
    setSelectedVehicleType(''); setSelectedPlate('');
    setWizardLoading(true);
    setWizardError(null);
    try {
      const res = await requestJson<{ data: { items: VehicleType[] } }>({
        path: `/users/buildings/${id}/vehicle-types`,
        token: token ?? undefined,
      });
      setVehicleTypes(res.data?.items ?? []);
    } catch (e) {
      setWizardError(e instanceof Error ? e.message : 'Failed to load vehicle types');
    } finally {
      setWizardLoading(false);
    }
  };

  const goToStep2 = async () => {
    if (!selectedBuilding || !selectedVehicleType || !selectedPlate) {
      setWizardError('Please complete all fields'); return;
    }
    setWizardError(null);
    setWizardLoading(true);
    setStep(2);
    try {
      const res = await requestJson<{ data: { items: Floor[] } }>({
        path: `/users/buildings/${selectedBuilding}/floors?vehicleTypeId=${selectedVehicleType}`,
        token: token ?? undefined,
      });
      setFloors(res.data?.items ?? []);
    } catch (e) {
      setWizardError(e instanceof Error ? e.message : 'Failed to load floors');
    } finally {
      setWizardLoading(false);
    }
  };

  const onFloorSelect = async (id: string) => {
    setSelectedFloor(id); setSelectedSlot('');
    setWizardLoading(true);
    try {
      const res = await requestJson<{ data: { items: Slot[] } }>({
        path: `/users/buildings/${selectedBuilding}/floors/${id}/slots`,
        token: token ?? undefined,
      });
      setSlots((res.data?.items ?? []).filter((s) => s.status === 'available'));
    } catch (e) {
      setWizardError(e instanceof Error ? e.message : 'Failed to load slots');
    } finally {
      setWizardLoading(false);
    }
  };

  const goToStep3 = () => {
    if (!selectedSlot) { setWizardError('Please select a slot'); return; }
    setWizardError(null);
    const days = next7Days();
    setStartDate(days[0]); setEndDate(days[0]);
    setStartTime('00:00'); setEndTime('01:00');
    setBookingFee(null);
    setStep(3);
  };

  // Fetch real fee estimate from server whenever step 3 times/vehicle change.
  useEffect(() => {
    if (step !== 3 || !startDate || !startTime || !endDate || !endTime || !selectedBuilding || !selectedVehicleType) {
      setBookingFee(null); return;
    }
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    if (end <= start) { setBookingFee(null); return; }

    let cancelled = false;
    setFetchingFee(true);
    requestJson<{ data: { estimatedFee: number; depositAmount: number; remainingFee: number; hourlyRate: number; hours: number; regularHours: number; peakHours: number; peakRate: number | null } }>({
      path: `/users/reservations/estimate?buildingId=${selectedBuilding}&vehicleTypeId=${selectedVehicleType}&startTime=${start.toISOString()}&endTime=${end.toISOString()}`,
      token: token ?? undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setBookingFee({
            estimatedFee: res.data.estimatedFee,
            deposit: res.data.depositAmount,
            remainingFee: res.data.remainingFee,
            hourlyRate: res.data.hourlyRate,
            hours: res.data.hours,
            regularHours: res.data.regularHours,
            peakHours: res.data.peakHours,
            peakRate: res.data.peakRate,
          });
        }
      })
      .catch(() => { if (!cancelled) setBookingFee(null); })
      .finally(() => { if (!cancelled) setFetchingFee(false); });
    return () => { cancelled = true; };
  }, [step, startDate, startTime, endDate, endTime, selectedBuilding, selectedVehicleType, token]);

  const handleSubmit = async () => {
    setWizardError(null);
    const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endISO = new Date(`${endDate}T${endTime}:00`).toISOString();
    if (new Date(endISO) <= new Date(startISO)) {
      setWizardError('Checkout time must be after start time'); return;
    }
    setSubmitting(true);
    try {
      const res = await requestJson<{ data: { reservation: Reservation; depositAmount: number; estimatedFee: number } }>({
        path: '/users/reservations',
        method: 'POST',
        token: token ?? undefined,
        body: {
          buildingId: selectedBuilding,
          vehicleTypeId: selectedVehicleType,
          plateNumber: selectedPlate,
          slotId: selectedSlot,
          startTime: startISO,
          endTime: endISO,
        },
      });
      const d = res.data;
      setSuccessMsg(
        `Reservation confirmed! Deposit charged: ${fmtMoney(d.depositAmount)}. Remaining ${fmtMoney(d.estimatedFee - d.depositAmount)} will be charged at checkout.`,
      );
      setShowWizard(false);
      loadReservations();
    } catch (e) {
      setWizardError(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this reservation?\n\nWarning: The deposit is non-refundable. You will NOT receive any refund.')) return;
    setCancellingId(id);
    try {
      await requestJson({ path: `/users/reservations/${id}`, method: 'DELETE', token: token ?? undefined });
      setSuccessMsg('Reservation cancelled. The deposit has been forfeited as a cancellation fee.');
      loadReservations();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setCancellingId(null);
    }
  };

  if (!session) return <Navigate to="/auth/login" replace />;
  if (user && user.licensePlates.length === 0) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full rounded-3xl border border-rose-500/30 bg-slate-900/90 p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert size={36} />
          </div>
          <h3 className="text-xl font-black text-rose-400">No License Plate Linked</h3>
          <p className="text-sm text-slate-300">Please link at least one license plate before making a reservation.</p>
          <button onClick={() => navigate('/profile')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-widest">
            Go to Profile
          </button>
        </motion.div>
      </main>
    );
  }

  const statusColor: Record<string, string> = {
    confirmed: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    checked_in: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    completed: 'text-slate-400 border-slate-500/30 bg-slate-500/10',
    cancelled: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    expired: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.06),transparent_60%)] pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.05),transparent_60%)] pointer-events-none blur-3xl" />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 relative z-10 space-y-8">

        {/* Header nav */}
        <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-slate-900/60 p-4 backdrop-blur-md shadow-2xl">
          <button onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-400 hover:border-orange-500/30 transition-all">
            <ArrowLeft size={14} /> Home
          </button>
          <h1 className="text-sm font-black uppercase tracking-widest text-white hidden sm:block">My Reservations</h1>
          <button onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-400 hover:border-orange-500/30 transition-all">
            <User size={14} /> Profile
          </button>
        </motion.div>

        {/* Success toast */}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 text-xs font-black text-emerald-400 flex items-start gap-3">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="ml-auto shrink-0"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4 text-xs font-black text-rose-400 flex items-start gap-3">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto shrink-0"><X size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Reservation button */}
        <div className="flex justify-end">
          <button onClick={openWizard}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-slate-950 hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all">
            <Plus size={14} /> New Reservation
          </button>
        </div>

        {/* Reservations list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 size={24} className="animate-spin mr-3" /> Loading reservations...
          </div>
        ) : reservations.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-20 rounded-3xl border border-white/5 bg-slate-900/30">
            <ParkingCircle size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 font-semibold">No reservations yet.</p>
            <p className="text-xs text-slate-600 mt-1">Click "New Reservation" to book a parking slot.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {reservations.map((r, i) => (
              <motion.div key={r._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-orange-400">{r.code}</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor[r.status] ?? 'text-slate-400 border-slate-500/30 bg-slate-500/10'}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div>
                      <p className="text-slate-500 font-black uppercase tracking-wider">Building</p>
                      <p className="text-slate-200 font-semibold">{r.building?.name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-black uppercase tracking-wider">Plate</p>
                      <p className="font-mono text-slate-200 font-black">{r.plateNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-black uppercase tracking-wider">Slot</p>
                      <p className="text-slate-200 font-semibold">
                        {r.slot ? `${r.slot.floor?.code ?? ''} / ${r.slot.code}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-black uppercase tracking-wider">Vehicle</p>
                      <p className="text-slate-200 font-semibold">{r.vehicleType?.name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-black uppercase tracking-wider">Check-in</p>
                      <p className="text-slate-200 font-semibold">{fmtDateTime(r.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-black uppercase tracking-wider">Checkout</p>
                      <p className="text-slate-200 font-semibold">{fmtDateTime(r.endTime)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-black uppercase tracking-wider">Deposit paid</p>
                      <p className="text-emerald-400 font-black">{fmtMoney(r.fee)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-black uppercase tracking-wider">Est. Total</p>
                      <p className="text-amber-400 font-black">{fmtMoney(r.estimatedFee)}</p>
                    </div>
                  </div>
                </div>
                {r.status === 'confirmed' && (
                  <button
                    onClick={() => handleCancel(r._id)}
                    disabled={cancellingId === r._id}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-black text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50">
                    {cancellingId === r._id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    Cancel
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Booking Wizard Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg rounded-3xl border border-white/8 bg-slate-900 shadow-2xl overflow-hidden">

              {/* Wizard header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">
                    Step {step} / 3
                  </p>
                  <h2 className="text-base font-black text-white mt-0.5">
                    {step === 1 ? 'Select Building & Vehicle' : step === 2 ? 'Select Floor & Slot' : 'Set Date & Time'}
                  </h2>
                </div>
                <button onClick={() => setShowWizard(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {wizardError && (
                  <div className="rounded-xl border border-rose-500/25 bg-rose-950/20 p-3 text-xs font-semibold text-rose-400 flex items-center gap-2">
                    <AlertTriangle size={13} /> {wizardError}
                  </div>
                )}

                {wizardLoading && (
                  <div className="flex items-center justify-center py-8 text-slate-500">
                    <Loader2 size={20} className="animate-spin mr-2" /> Loading...
                  </div>
                )}

                {/* ── Step 1 ─────────────────────────────────────────────────── */}
                {step === 1 && !wizardLoading && (
                  <div className="space-y-4">
                    {/* Building */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Building2 size={11} /> Building
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {buildings.map((b) => (
                          <button key={b._id} type="button"
                            onClick={() => onBuildingSelect(b._id)}
                            className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${selectedBuilding === b._id ? 'border-orange-500/50 bg-orange-500/10 text-orange-300' : 'border-white/5 bg-slate-950/60 text-slate-300 hover:border-white/15'}`}>
                            <p className="font-black">{b.name}</p>
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                              {b.code} · {typeof b.address === 'string' ? b.address : b.address?.fullAddress ?? ''}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Vehicle Type */}
                    {vehicleTypes.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Vehicle Type</label>
                        <div className="flex gap-2 flex-wrap">
                          {vehicleTypes.map((vt) => (
                            <button key={vt._id} type="button"
                              onClick={() => setSelectedVehicleType(vt._id)}
                              className={`rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${selectedVehicleType === vt._id ? 'border-orange-500/50 bg-orange-500/15 text-orange-400' : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20'}`}>
                              {vt.name.toLowerCase().includes('motor') ? <Bike size={11} /> : <Car size={11} />}
                              {vt.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* License plate */}
                    {selectedVehicleType && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">License Plate</label>
                        <select value={selectedPlate} onChange={(e) => setSelectedPlate(e.target.value)}
                          className="w-full h-10 rounded-xl border border-white/10 bg-slate-950 text-white text-sm px-3 outline-none focus:border-orange-500 transition-all font-mono">
                          <option value="" disabled>-- Select plate --</option>
                          {(user?.licensePlates ?? []).map((p: { plateNumber: string }) => (
                            <option key={p.plateNumber} value={p.plateNumber}>{p.plateNumber}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <button onClick={goToStep2} disabled={!selectedBuilding || !selectedVehicleType || !selectedPlate}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2">
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {/* ── Step 2 ─────────────────────────────────────────────────── */}
                {step === 2 && !wizardLoading && (
                  <div className="space-y-4">
                    {/* Floors */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Layers size={11} /> Floor
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {floors.map((f) => (
                          <button key={f._id} type="button"
                            onClick={() => onFloorSelect(f._id)}
                            className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${selectedFloor === f._id ? 'border-orange-500/50 bg-orange-500/10 text-orange-300' : 'border-white/5 bg-slate-950/60 text-slate-300 hover:border-white/15'}`}>
                            <p className="font-black">{f.name || f.code}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {f.availableSlots ?? '?'} / {f.totalSlots ?? '?'} slots available
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Slots */}
                    {slots.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <ParkingCircle size={11} /> Slot
                        </label>
                        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                          {slots.map((s) => (
                            <button key={s._id} type="button"
                              onClick={() => setSelectedSlot(s._id)}
                              className={`rounded-xl border py-2.5 text-xs font-mono font-black uppercase transition-all ${selectedSlot === s._id ? 'border-orange-500/50 bg-orange-500/15 text-orange-400' : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20'}`}>
                              {s.code}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => setStep(1)}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 font-black text-xs uppercase tracking-widest hover:border-white/20 transition-all">
                        Back
                      </button>
                      <button onClick={goToStep3} disabled={!selectedSlot}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2">
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Step 3 ─────────────────────────────────────────────────── */}
                {step === 3 && (
                  <div className="space-y-4">
                    {/* Start date/time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Calendar size={11} /> Check-in Date
                        </label>
                        <select value={startDate} onChange={(e) => { setStartDate(e.target.value); setEndDate(e.target.value); }}
                          className="w-full h-10 rounded-xl border border-white/10 bg-slate-950 text-white text-xs px-3 outline-none focus:border-orange-500 transition-all">
                          {next7Days().map((d) => (
                            <option key={d} value={d}>{new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Clock size={11} /> Check-in Time
                        </label>
                        <select value={startTime} onChange={(e) => setStartTime(e.target.value)}
                          className="w-full h-10 rounded-xl border border-white/10 bg-slate-950 text-white text-xs px-3 outline-none focus:border-orange-500 transition-all font-mono">
                          {ALL_TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* End date/time */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Calendar size={11} /> Checkout Date
                        </label>
                        <select value={endDate} onChange={(e) => setEndDate(e.target.value)}
                          className="w-full h-10 rounded-xl border border-white/10 bg-slate-950 text-white text-xs px-3 outline-none focus:border-orange-500 transition-all">
                          {next7Days().filter((d) => d >= startDate).map((d) => (
                            <option key={d} value={d}>{new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Clock size={11} /> Checkout Time
                        </label>
                        <select value={endTime} onChange={(e) => setEndTime(e.target.value)}
                          className="w-full h-10 rounded-xl border border-white/10 bg-slate-950 text-white text-xs px-3 outline-none focus:border-orange-500 transition-all font-mono">
                          {ALL_TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Fee breakdown */}
                    {(fetchingFee || bookingFee) && (
                      <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                          <Info size={11} /> Fee Breakdown
                        </p>
                        {fetchingFee ? (
                          <p className="text-xs text-slate-500 italic">Calculating fee...</p>
                        ) : bookingFee && (
                          <div className="space-y-1 text-xs">
                            {bookingFee.peakHours > 0 ? (
                              <>
                                <div className="flex justify-between text-slate-500 text-[10px]">
                                  <span>Regular hours</span>
                                  <span>{bookingFee.regularHours}h × {fmtMoney(bookingFee.hourlyRate)}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-orange-400/80">
                                  <span>Peak hours</span>
                                  <span>{bookingFee.peakHours}h × {fmtMoney(bookingFee.peakRate ?? 0)}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between text-slate-500 text-[10px]">
                                <span>Rate</span>
                                <span>{fmtMoney(bookingFee.hourlyRate)}/hour × {bookingFee.hours}h</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-slate-400">Estimated Total</span>
                              <span className="font-black text-white">{fmtMoney(bookingFee.estimatedFee)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 flex items-center gap-1">
                                <Wallet size={10} /> Deposit now (15%)
                              </span>
                              <span className="font-black text-amber-400">{fmtMoney(bookingFee.deposit)}</span>
                            </div>
                            <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                              <span className="text-slate-400">Remaining at checkout</span>
                              <span className="font-black text-emerald-400">{fmtMoney(bookingFee.remainingFee)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => setStep(2)}
                        className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 font-black text-xs uppercase tracking-widest hover:border-white/20 transition-all">
                        Back
                      </button>
                      <button onClick={handleSubmit} disabled={submitting || !startTime || !endTime}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2">
                        {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        Confirm & Pay Deposit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
