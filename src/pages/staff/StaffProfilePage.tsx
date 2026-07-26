import { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Edit,
  LogOut,
  Save,
  User,
  X,
  Mail,
  Phone,
  Shield,
  Fingerprint,
  QrCode,
  MapPin
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import styles from '@/styles/modules/StaffProfilePage.module.css';

export function StaffProfilePage() {
  const { session, user, logout, updateProfile } = useAuth();
  const { building } = useBuildingContext();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!session?.token || session?.role !== 'staff') {
    return <Navigate to="/auth/login" replace />;
  }

  const displayName = session.displayName || user?.fullName || '';
  const initials = (displayName || session.email || 'S')[0]?.toUpperCase();

  const handleStartEdit = () => {
    setFullName(displayName);
    setPhone(session.phone || '');
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);
    const trimmedName = fullName.trim();
    const newPhone = phone.trim();
    if (!trimmedName) { setNameError('Please enter your full name!'); return; }
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(newPhone)) {
      setPhoneError('Phone number must start with 0 and be exactly 10 digits!');
      return;
    }
    updateProfile({ fullName: trimmedName, phone: newPhone, licensePlates: session.licensePlates || [] });
    setIsEditing(false);
    setSuccess('Information updated successfully!');
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4 max-w-6xl mx-auto relative overflow-hidden"
    >
      {/* Decorative background mesh blurs */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-sky-200/25 blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-blue-100/30 blur-3xl pointer-events-none -z-10" />

      {/* Success Notification Alert */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm"
        >
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>{success}</span>
        </motion.div>
      )}

      {/* Header Banner */}
      <section
        className={`relative overflow-hidden rounded-2xl p-4 ${styles.headerBanner}`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl animate-pulse ${styles.headerIcon}`}>
              <User className="text-sky-600" size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-sky-500 leading-none">Security System</p>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight mt-1">My Profile</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Manage your personal information and system access</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            {!isEditing && (
              <Button
                onClick={handleStartEdit}
                className="gap-1.5 h-8 rounded-xl border border-sky-100 bg-sky-50 text-sky-700 hover:bg-sky-100/70 font-bold text-xs"
              >
                <Edit size={12} /> Edit Profile
              </Button>
            )}
            <Button
              onClick={() => { logout(); navigate('/auth/login', { replace: true }); }}
              className="gap-1.5 h-8 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100/70 font-bold text-xs"
            >
              <LogOut size={12} /> Sign Out
            </Button>
          </div>
        </div>
      </section>

      {/* Grid: 2 Columns layout (Left: Smart ID Card, Right: Details + Station) */}
      <div className="grid gap-4 lg:grid-cols-[290px,1fr]">
        
        {/* Left Column: Smart Access ID Card */}
        <div
          className={`relative overflow-hidden rounded-3xl p-5 text-center flex flex-col items-center justify-between min-h-[300px] ${styles.idCard}`}
        >
          {/* Holographic Header Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-500/10 to-transparent blur-xl pointer-events-none" />

          <div className="flex flex-col items-center w-full">
            {/* Avatar Container with glowing rings */}
            <div className="relative mt-2">
              <div className="absolute inset-0 rounded-2xl bg-sky-500/15 blur-sm animate-pulse" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-sky-300 bg-gradient-to-br from-slate-900 to-slate-950 text-xl font-black text-sky-400 shadow-md">
                {initials}
              </div>
            </div>

            <span className="mt-3.5 inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-sky-600 border border-sky-100 font-mono">
              <Fingerprint size={9} /> Staff Portal
            </span>

            <h2 className="mt-3 text-sm font-extrabold text-slate-800 tracking-tight leading-snug truncate max-w-full">
              {displayName || 'Staff'}
            </h2>
            <p className="text-[10px] text-slate-400 truncate max-w-full mt-0.5 font-semibold">{session.email}</p>
          </div>

          {/* Holographic Access Tag / QR Code */}
          <div className="mt-4 pt-4 border-t border-slate-100/80 w-full flex items-center justify-center gap-2.5">
            <QrCode size={24} className="text-sky-500/80" />
            <div className="flex flex-col items-start leading-none text-left">
              <span className="font-mono text-[8px] font-black tracking-widest text-slate-500">ID-{session.email.split('@')[0].toUpperCase()}</span>
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">Active Access</span>
            </div>
          </div>
        </div>

        {/* Right Column: Account Details (2x2 grid) + Assigned Station (horizontal bar) */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Details Panel */}
          <div
            className={`relative overflow-hidden rounded-3xl p-5 ${styles.panel}`}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />
            <h3 className="text-xs font-extrabold text-slate-800 tracking-tight mb-4">Account Information</h3>

            {isEditing ? (
              <form onSubmit={handleSave} noValidate className="grid gap-3.5 md:grid-cols-2 relative z-10 animate-fadeIn">
                {/* Họ tên */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User size={13} />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setNameError(null); }}
                      required
                      className="h-9 w-full rounded-xl border border-sky-100 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                      placeholder="Enter full name"
                    />
                  </div>
                  {nameError && (
                    <p className="flex items-center gap-1.5 text-[10px] text-rose-500 mt-0.5 font-semibold">
                      <AlertCircle size={11} /> {nameError}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1 opacity-60">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={13} />
                    </div>
                    <input
                      type="email"
                      value={session.email}
                      disabled
                      className="h-9 w-full rounded-xl border border-sky-100 bg-slate-50 pl-9 pr-3 text-xs text-slate-500 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={13} />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, '')); setPhoneError(null); }}
                      maxLength={10}
                      required
                      className="h-9 w-full rounded-xl border border-sky-100 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                      placeholder="0901234567"
                    />
                  </div>
                  {phoneError && (
                    <p className="flex items-center gap-1.5 text-[10px] text-rose-500 mt-0.5 font-semibold leading-normal">
                      <AlertCircle size={11} /> {phoneError}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-end gap-2.5 pt-3 md:col-span-2">
                  <Button
                    type="submit"
                    className="gap-1.5 h-8.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-extrabold text-xs uppercase tracking-wider px-5 hover:shadow-md transition-all duration-200"
                  >
                    <Save size={12} /> Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel}
                    className="gap-1.5 h-8.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 px-5 font-bold text-xs uppercase tracking-wider transition-all duration-200"
                  >
                    <X size={12} /> Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 relative z-10">
                {[
                  { label: 'Full Name', value: displayName || 'Not updated', icon: User },
                  { label: 'Email Address', value: session.email, icon: Mail },
                  { label: 'Phone Number', value: session.phone || 'Not updated', icon: Phone },
                  { label: 'System Role', value: 'OPERATIONS STAFF', icon: Shield },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <motion.div
                      key={f.label}
                      whileHover={{ y: -2 }}
                      className={`flex items-center gap-3.5 rounded-2xl p-3 transition-all duration-200 border ${styles.infoRow}`}
                    >
                      <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{f.label}</p>
                        <p className="mt-0.5 text-xs font-bold text-slate-700 truncate">{f.value}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assigned Station (Horizontal Ribbon Bar) */}
          {building && (
            <div
              className={`relative overflow-hidden rounded-3xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${styles.panel}`}
            >
              <div className="absolute top-0 inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-400 via-sky-500 to-transparent md:bg-gradient-to-r md:w-auto md:h-1 md:inset-x-0 md:top-0" />
              
              <div className="flex items-center gap-2 relative z-10 shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 border border-sky-100 text-sky-500">
                  <Building2 size={14} />
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Assigned Building</p>
                  <p className="text-[11px] font-extrabold text-slate-800">{building.name}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 relative z-10">
                {/* Building Code Badge */}
                <div className="rounded-xl border border-sky-100 bg-sky-50 px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm">
                  <MapPin size={12} className="text-sky-500" />
                  <span className="font-mono text-xs text-sky-700 font-black">{building.code}</span>
                </div>

                {/* Operating Hours */}
                {building.operatingHours && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3.5 py-1.5 shadow-sm">
                    <Clock size={12} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-600 font-sans">
                      {building.operatingHours.open} – {building.operatingHours.close}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
