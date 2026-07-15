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
  Fingerprint
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
      className="space-y-5 max-w-6xl mx-auto"
    >
      {/* Success Notification Alert */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-xs font-bold text-emerald-700 shadow-md"
        >
          <CheckCircle2 size={15} className="text-emerald-500" />
          <span>{success}</span>
        </motion.div>
      )}

      {/* Profile Page Header */}
      <section
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, rgba(224,242,254,0.7) 0%, rgba(255,255,255,0.75) 50%, rgba(219,234,254,0.5) 100%)',
          border: '1px solid rgba(14,165,233,0.18)',
          boxShadow: '0 4px 24px rgba(14,165,233,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                border: '1px solid rgba(14,165,233,0.22)',
                boxShadow: '0 4px 12px rgba(14,165,233,0.12)',
              }}>
              <User className="text-sky-600" size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-500">Security System</p>
              <h2 className="text-lg font-extrabold text-slate-800 leading-tight">My Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage your personal information and assignment</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start lg:self-auto">
            {!isEditing && (
              <Button
                onClick={handleStartEdit}
                className="gap-1.5 h-9 rounded-xl border border-sky-100 bg-sky-50 text-sky-700 hover:bg-sky-100/70 font-bold text-xs"
              >
                <Edit size={13} /> Edit Profile
              </Button>
            )}
            <Button
              onClick={() => { logout(); navigate('/auth/login', { replace: true }); }}
              className="gap-1.5 h-9 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100/70 font-bold text-xs"
            >
              <LogOut size={13} /> Sign Out
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_310px]">
        {/* Left Side: Detail Fields or Edit Form */}
        <div
          className="relative overflow-hidden rounded-3xl p-5 md:p-6"
          style={{
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid rgba(14,165,233,0.14)',
            boxShadow: '0 10px 30px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />
          <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mb-5">Account Information</h3>

          {isEditing ? (
            <form onSubmit={handleSave} className="grid gap-5 md:grid-cols-2 relative z-10">
              {/* Họ tên */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setNameError(null); }}
                    required
                    className="h-10 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                    placeholder="Enter full name"
                  />
                </div>
                {nameError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-500 mt-1 font-semibold">
                    <AlertCircle size={13} /> {nameError}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5 opacity-60">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={session.email}
                    disabled
                    className="h-10 w-full rounded-xl border border-sky-100 bg-slate-50 pl-10 pr-4 text-xs text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone size={15} />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, '')); setPhoneError(null); }}
                    maxLength={10}
                    required
                    className="h-10 w-full rounded-xl border border-sky-100 bg-white pl-10 pr-4 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all duration-200"
                    placeholder="0901234567"
                  />
                </div>
                {phoneError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-500 mt-1 font-semibold leading-normal">
                    <AlertCircle size={13} /> {phoneError}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-end gap-3 pt-3 md:col-span-2">
                <Button
                  type="submit"
                  className="gap-2 h-10 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-extrabold text-xs uppercase tracking-wider px-6 hover:shadow-md transition-all duration-200"
                >
                  <Save size={14} /> Save Changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  className="gap-2 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 px-6 font-bold text-xs uppercase tracking-wider transition-all duration-200"
                >
                  <X size={14} /> Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 relative z-10">
              {[
                { label: 'Full Name', value: displayName || 'Not updated', icon: User },
                { label: 'Email Address', value: session.email, icon: Mail },
                { label: 'Phone Number', value: session.phone || 'Not updated', icon: Phone },
                { label: 'System Role', value: 'OPERATIONS STAFF', icon: Shield },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.label}
                    className="flex items-center gap-4 rounded-2xl p-4 transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(14,165,233,0.1)',
                      boxShadow: '0 2px 10px rgba(14,165,233,0.03)',
                    }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{f.label}</p>
                      <p className="mt-1 text-xs font-bold text-slate-700 truncate">{f.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Identity Card Badge & Assigned Building */}
        <div className="space-y-4">
          {/* Identity Employee Badge */}
          <div
            className="relative overflow-hidden rounded-3xl p-5 text-center flex flex-col items-center"
            style={{
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(14,165,233,0.14)',
              boxShadow: '0 10px 30px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />

            {/* Avatar container with hover glow */}
            <div className="relative mt-2">
              <div className="absolute inset-0 rounded-2xl bg-sky-500/20 blur-md opacity-40" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-sky-300 bg-gradient-to-br from-slate-900 to-slate-950 text-2xl font-black text-sky-400 shadow-md">
                {initials}
              </div>
            </div>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-sky-600 border border-sky-100 font-mono">
              <Fingerprint size={10} /> Staff Portal
            </span>

            <h2 className="mt-3 text-sm font-extrabold text-slate-800 tracking-tight leading-snug truncate max-w-full">
              {displayName || 'Staff'}
            </h2>
            <p className="text-xs text-slate-400 truncate max-w-full mt-0.5 font-medium">{session.email}</p>
          </div>

          {/* Assigned Building Card */}
          {building && (
            <div
              className="relative overflow-hidden rounded-3xl p-5"
              style={{
                background: 'rgba(255,255,255,0.72)',
                border: '1px solid rgba(14,165,233,0.14)',
                boxShadow: '0 10px 30px rgba(14,165,233,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-sky-500 to-transparent" />

              <div className="flex items-center gap-2 mb-3.5 relative z-10">
                <Building2 size={14} className="text-sky-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Assigned Building</p>
              </div>

              <div className="space-y-3 relative z-10">
                <div
                  className="rounded-2xl p-3"
                  style={{
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(14,165,233,0.1)',
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Building Name</p>
                  <p className="mt-0.5 text-xs font-bold text-slate-700">{building.name}</p>
                </div>
                <div
                  className="rounded-2xl p-3"
                  style={{
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(14,165,233,0.1)',
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Building Code</p>
                  <p className="mt-0.5 font-mono text-xs text-sky-600 font-black">{building.code}</p>
                </div>
                {building.operatingHours && (
                  <div
                    className="flex items-center gap-2.5 rounded-2xl p-3"
                    style={{
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(14,165,233,0.1)',
                    }}
                  >
                    <Clock size={13} className="text-sky-500" />
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
