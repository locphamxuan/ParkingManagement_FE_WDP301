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
      {/* Decorative floating blur circles in background */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-sky-200/20 blur-3xl pointer-events-none -z-10" />
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

      {/* Profile Page Header */}
      <section
        className="relative overflow-hidden rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(224,242,254,0.72) 0%, rgba(255,255,255,0.8) 50%, rgba(219,234,254,0.55) 100%)',
          border: '1px solid rgba(14,165,233,0.2)',
          boxShadow: '0 4px 20px rgba(14,165,233,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                border: '1px solid rgba(14,165,233,0.25)',
                boxShadow: '0 2px 8px rgba(14,165,233,0.1)',
              }}>
              <User className="text-sky-600" size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-sky-500 leading-none">Security System</p>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight mt-1">My Profile</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Manage your personal information and system access</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-auto">
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

      {/* Grid: 3 columns side-by-side to prevent vertical scrolling */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr,0.8fr,0.8fr]">
        
        {/* Column 1: Account Information */}
        <div
          className="relative overflow-hidden rounded-3xl p-4 md:p-5 flex flex-col justify-between"
          style={{
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid rgba(14,165,233,0.14)',
            boxShadow: '0 4px 20px rgba(14,165,233,0.03), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />
            <h3 className="text-xs font-extrabold text-slate-800 tracking-tight mb-4">Account Information</h3>

            {isEditing ? (
              <form onSubmit={handleSave} className="grid gap-3.5 md:grid-cols-2 relative z-10 animate-fadeIn">
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
                      className="h-8.5 w-full rounded-xl border border-sky-100 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
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
                      className="h-8.5 w-full rounded-xl border border-sky-100 bg-slate-50 pl-9 pr-3 text-xs text-slate-500 outline-none cursor-not-allowed"
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
                      className="h-8.5 w-full rounded-xl border border-sky-100 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
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
                      className="flex items-center gap-3 rounded-xl p-3 transition-all duration-200 border"
                      style={{
                        background: 'rgba(255,255,255,0.5)',
                        borderColor: 'rgba(14,165,233,0.08)',
                        boxShadow: '0 1px 8px rgba(14,165,233,0.01), inset 0 1px 0 rgba(255,255,255,0.9)',
                      }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{f.label}</p>
                        <p className="mt-0.5 text-[11px] font-bold text-slate-700 truncate">{f.value}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Identity Employee Badge */}
        <div
          className="relative overflow-hidden rounded-3xl p-4 md:p-5 text-center flex flex-col items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%)',
            border: '1px solid rgba(14,165,233,0.16)',
            boxShadow: '0 4px 20px rgba(14,165,233,0.03), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600" />
          
          <div className="flex flex-col items-center">
            {/* Avatar container with hover glow */}
            <div className="relative mt-1">
              <div className="absolute inset-0 rounded-2xl bg-sky-500/15 blur-sm" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-sky-350 bg-gradient-to-br from-slate-900 to-slate-950 text-lg font-black text-sky-400 shadow-sm">
                {initials}
              </div>
            </div>

            <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-sky-600 border border-sky-100 font-mono">
              <Fingerprint size={9} /> Staff Portal
            </span>

            <h2 className="mt-2 text-xs font-extrabold text-slate-800 tracking-tight leading-snug truncate max-w-full">
              {displayName || 'Staff'}
            </h2>
            <p className="text-[10px] text-slate-400 truncate max-w-full mt-0.5 font-semibold">{session.email}</p>
          </div>

          {/* Futuristic QR code Smart Access area */}
          <div className="mt-3 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-2">
            <QrCode size={20} className="text-slate-400" />
            <div className="flex flex-col items-start leading-none text-left">
              <span className="font-mono text-[8px] font-black tracking-widest text-slate-500">ID-{session.email.split('@')[0].toUpperCase()}</span>
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">Active Access</span>
            </div>
          </div>
        </div>

        {/* Column 3: Assigned Building Card */}
        {building && (
          <div
            className="relative overflow-hidden rounded-3xl p-4 md:p-5 flex flex-col justify-between"
            style={{
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(14,165,233,0.14)',
              boxShadow: '0 4px 20px rgba(14,165,233,0.03), inset 0 1px 0 rgba(255,255,255,0.9)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />

            <div className="flex items-center gap-1.5 mb-2.5 relative z-10">
              <Building2 size={13} className="text-sky-500" />
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Assigned Building</p>
            </div>

            <div className="space-y-2 relative z-10">
              <div
                className="rounded-xl p-2 flex items-center justify-between"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(14,165,233,0.08)',
                }}
              >
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 leading-none">Code</p>
                  <p className="mt-0.5 font-mono text-[11px] text-sky-600 font-black">{building.code}</p>
                </div>
                <div className="h-6 w-6 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500">
                  <MapPin size={12} />
                </div>
              </div>

              <div
                className="rounded-xl p-2"
                style={{
                  background: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(14,165,233,0.08)',
                }}
              >
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 leading-none">Name</p>
                <p className="mt-0.5 text-[11px] font-bold text-slate-700 truncate">{building.name}</p>
              </div>

              {building.operatingHours && (
                <div
                  className="flex items-center gap-2 rounded-xl p-2"
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(14,165,233,0.08)',
                  }}
                >
                  <Clock size={11} className="text-sky-500" />
                  <p className="text-[10px] font-bold text-slate-600 font-sans leading-none">
                    {building.operatingHours.open} – {building.operatingHours.close}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
