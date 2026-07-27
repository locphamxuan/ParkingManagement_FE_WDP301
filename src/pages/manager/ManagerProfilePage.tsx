import { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
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
import { useManagerBuildings } from '@/hooks/useManagerBuildings';
import { Button } from '@/components/ui/button';

export function ManagerProfilePage() {
  const { session, logout, updateProfile } = useAuth();
  const { buildings, selectedBuildingId } = useManagerBuildings();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!session?.token || session?.role !== 'manager') {
    return <Navigate to="/auth/login" replace />;
  }

  const selectedBuilding = buildings.find((b) => b._id === selectedBuildingId);
  const displayName = session.displayName || '';
  const initials = (displayName || session.email || 'M')[0]?.toUpperCase();

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
    if (!trimmedName) {
      setNameError('Please enter your full name!');
      return;
    }
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Success Notification Alert */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm font-bold text-emerald-700 shadow-sm animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
              Operations Manager
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <User size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
              My Profile
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Manage your personal profile, contact information, and view assigned buildings.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {!isEditing && (
              <Button
                variant="outline"
                onClick={handleStartEdit}
                className="h-11 px-5 rounded-xl border-blue-100 bg-white text-slate-850 hover:bg-slate-50 font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-[0.98] gap-1.5"
              >
                <Edit size={13} className="text-blue-600" /> Edit Profile
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                logout();
                navigate('/auth/login', { replace: true });
              }}
              className="h-11 px-5 rounded-xl border-rose-100 bg-white text-rose-600 hover:bg-rose-50 font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-[0.98] gap-1.5"
            >
              <LogOut size={13} /> Sign out
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_310px]">
        {/* Left Side: Detail Fields or Edit Form */}
        <div className="rounded-3xl border border-blue-100 bg-white/70 p-6 shadow-md backdrop-blur-md relative overflow-hidden">
          {/* Decorative Corner Glow */}
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.03),transparent_60%)] pointer-events-none blur-2xl" />

          <p className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">Account information</p>

          {isEditing ? (
            <form onSubmit={handleSave} noValidate className="grid gap-5 md:grid-cols-2 relative z-10">
              {/* Họ tên */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Full name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setNameError(null);
                    }}
                    required
                    className="h-11 w-full rounded-xl border border-blue-100 bg-white pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all duration-300"
                    placeholder="John Doe"
                  />
                </div>
                {nameError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-semibold">
                    <AlertCircle size={13} /> {nameError}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5 opacity-80">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={session.email}
                    disabled
                    className="h-11 w-full rounded-xl border border-blue-100 bg-slate-50 pl-10 pr-4 text-sm text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Phone number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone size={15} />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/[^0-9]/g, ''));
                      setPhoneError(null);
                    }}
                    maxLength={10}
                    required
                    className="h-11 w-full rounded-xl border border-blue-100 bg-white pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all duration-300"
                    placeholder="0901234567"
                  />
                </div>
                {phoneError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-600 mt-1 font-semibold leading-normal">
                    <AlertCircle size={13} /> {phoneError}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-end gap-3 pt-3 md:col-span-2">
                <Button
                  type="submit"
                  className="gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider px-6 h-11 hover:shadow-[0_0_15px_rgba(37,99,235,0.25)] transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                >
                  <Save size={14} className="text-white" /> Save changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  className="gap-2 rounded-xl border border-blue-150 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800 px-6 h-11 font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                  <X size={14} className="text-slate-400" /> Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 relative z-10">
              {[
                { label: 'Full name', value: displayName || 'Not updated', icon: User },
                { label: 'Email', value: session.email, icon: Mail },
                { label: 'Phone number', value: session.phone || 'Not updated', icon: Phone },
                { label: 'Role', value: 'MANAGER', icon: Shield }
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.label}
                    className="flex items-center gap-4 rounded-2xl border border-blue-100/50 bg-white/60 p-4 transition-all duration-300 hover:border-blue-300 hover:bg-slate-50/50 shadow-sm group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100/50 group-hover:scale-105 transition-all duration-300">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 font-mono">{f.label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-800 truncate">{f.value}</p>
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
          <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white/70 p-5 shadow-md backdrop-blur-md text-center flex flex-col items-center">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-500" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent blur-xl pointer-events-none" />

            {/* Avatar container with hover glow */}
            <div className="relative mt-2 group">
              <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-md opacity-30 group-hover:opacity-60 transition-all duration-500" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-blue-300/40 bg-gradient-to-br from-blue-50 to-slate-50 text-2xl font-black text-blue-600 shadow-sm">
                {initials}
              </div>
            </div>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-blue-600 border border-blue-100 font-mono">
              <Fingerprint size={10} /> Manager Portal
            </span>

            <h2 className="mt-3 text-base font-extrabold text-slate-800 tracking-tight leading-snug truncate max-w-full">
              {displayName || 'Manager'}
            </h2>
            <p className="text-xs text-slate-500 truncate max-w-full mt-0.5 font-medium">{session.email}</p>
          </div>

          {/* Assigned Building Card */}
          {selectedBuilding && (
            <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white/70 p-5 shadow-md backdrop-blur-md">
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tr from-blue-500/5 to-transparent blur-xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-3.5 relative z-10">
                <Building2 size={14} className="text-blue-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">Assigned buildings</p>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="rounded-2xl border border-blue-100/40 bg-white/50 px-4 py-3 hover:border-blue-200 transition-all">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 font-mono">Building name</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-700">{selectedBuilding.name}</p>
                </div>
                <div className="rounded-2xl border border-blue-100/40 bg-white/50 px-4 py-3 hover:border-blue-200 transition-all">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 font-mono">Building code</p>
                  <p className="mt-0.5 font-mono text-sm text-blue-600 font-extrabold">{selectedBuilding.code}</p>
                </div>
                {buildings.length > 1 && (
                  <div className="px-4 py-1">
                    <p className="text-[10px] font-bold text-blue-650 font-mono uppercase tracking-wider">
                      +{buildings.length - 1} more buildings
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
