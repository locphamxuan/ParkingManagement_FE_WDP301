import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, LogOut, Save, X, AlertCircle, CheckCircle2, ShieldAlert, ShieldCheck, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ManagerProfilePage() {
  const { session, logout, updateProfile } = useAuth();
  const { subscription } = useBuildingContext();
  const navigate = useNavigate();

  const fmtDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { dateStyle: 'medium' } as Intl.DateTimeFormatOptions) : '—';

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!session?.token || session?.role !== 'manager') {
    return <Navigate to="/manager/login" replace />;
  }

  const displayName = session.displayName || 'Manager';
  const avatarText = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const startEdit = () => {
    setFullName(session.displayName || '');
    setPhone(session.phone || '');
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
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
    const oldPhone = (session.phone || '').trim();

    if (!trimmedName) {
      setNameError('Please enter your full name!');
      return;
    }

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(newPhone)) {
      setPhoneError('Phone number must start with 0 and be exactly 10 digits!');
      return;
    }

    updateProfile({
      fullName: trimmedName,
      phone: newPhone,
      licensePlates: session.licensePlates || [],
    });

    setIsEditing(false);
    setSuccess('Profile updated successfully!');
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {success ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-sm">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{success}</span>
          </div>
        ) : null}

        {/* Subscription status — gate to the manager dashboard */}
        {subscription ? (
          subscription.active ? (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 shadow-sm">
              <ShieldCheck size={18} className="shrink-0 text-emerald-400" />
              <span className="font-semibold">
                Subscription active{subscription.packageName ? ` — ${subscription.packageName}` : ''}.
              </span>
              <span className="text-emerald-200/80">
                Valid until {fmtDate(subscription.endDate)} ({subscription.daysRemaining} day{subscription.daysRemaining === 1 ? '' : 's'} left).
              </span>
              <Button size="sm" variant="secondary" className="ml-auto gap-2" onClick={() => navigate('/manager/wallet')}>
                <Wallet size={14} /> View Wallet
              </Button>
            </div>
          ) : (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-100">No active subscription</p>
                  <p className="mt-1 text-sm text-amber-200/85">
                    Your building does not have an active admin-system subscription, so the manager dashboard is locked.
                    Go to your wallet to top up and purchase a package — once active, the full dashboard unlocks automatically.
                  </p>
                  <Button className="mt-3 gap-2" onClick={() => navigate('/manager/wallet')}>
                    <Wallet size={15} /> Go to Wallet — Subscribe &amp; Top Up
                  </Button>
                </div>
              </div>
            </div>
          )
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card className="overflow-hidden border-slate-700 bg-slate-900/95 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-24 w-24 place-items-center rounded-full border border-slate-700 bg-slate-950 text-white shadow-sm">
                  <span className="text-2xl font-semibold uppercase tracking-wider">{avatarText || 'M'}</span>
                </div>

                <div className="mt-5 space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Manager Profile</p>
                  <h1 className="text-2xl font-semibold text-white">{displayName}</h1>
                  <p className="text-sm uppercase tracking-[0.16em] text-slate-300">{session.role}</p>
                </div>

                <div className="mt-6 w-full space-y-3 text-left">
                  <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</p>
                    <p className="mt-1 break-all text-sm font-medium text-white">{session.email}</p>
                  </div>

                  <div className="grid gap-2 pt-2">
                    <Button type="button" onClick={startEdit} className="w-full justify-center gap-2">
                      <Edit size={15} /> Edit Profile
                    </Button>
                    <Button type="button" variant="secondary" className="w-full justify-center gap-2" onClick={() => navigate('/manager/dashboard')}>
                      <ArrowLeft size={15} /> Dashboard
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-center gap-2 text-rose-300 hover:bg-rose-500/10 hover:text-rose-100"
                      onClick={() => {
                        logout();
                        navigate('/manager/login', { replace: true });
                      }}
                    >
                      <LogOut size={15} /> Sign out
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-slate-700 bg-slate-900/95 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
                <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {isEditing ? (
                  <form onSubmit={handleSave} className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setNameError(null);
                        }}
                        className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10"
                        placeholder="e.g. John Doe"
                      />
                      {nameError ? (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-300">
                          <AlertCircle size={13} /> {nameError}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Email</label>
                      <input
                        type="email"
                        value={session.email}
                        disabled
                        className="h-11 cursor-not-allowed rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-slate-200 outline-none"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Role</label>
                      <input
                        type="text"
                        value={session.role}
                        disabled
                        className="h-11 cursor-not-allowed rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-mono uppercase text-slate-200 outline-none"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Phone number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPhone(val);
                          setPhoneError(null);
                        }}
                        maxLength={10}
                        className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10"
                        placeholder="e.g. 0901234567"
                      />
                      {phoneError ? (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-300">
                          <AlertCircle size={13} /> {phoneError}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button type="submit" className="gap-2">
                        <Save size={15} /> Save changes
                      </Button>
                      <Button type="button" variant="secondary" className="gap-2" onClick={cancelEdit}>
                        <X size={15} /> Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Name</p>
                      <p className="mt-1 text-base font-medium text-white">{displayName || 'Not set'}</p>
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</p>
                      <p className="mt-1 break-all text-sm font-medium text-slate-100">{session.email}</p>
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-slate-100">{session.role}</p>
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Phone number</p>
                      <p className="mt-1 text-base font-medium text-white">{session.phone || 'Not set'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900/95 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
                <CardHeader>
                <CardTitle>Account settings</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                    <p className="text-sm font-semibold text-white">Operational notifications</p>
                    <p className="mt-1 text-sm text-slate-300">Receive shift operation alerts</p>
                    <div className="mt-4 inline-flex rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                      Ready
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                    <p className="text-sm font-semibold text-white">Two-factor authentication</p>
                    <p className="mt-1 text-sm text-slate-300">Improve account security</p>
                    <div className="mt-4 inline-flex rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                      Disabled
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 md:col-span-2">
                    <p className="text-sm font-semibold text-white">Interface language</p>
                    <p className="mt-1 text-sm text-slate-300">English</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ManagerProfilePage;
