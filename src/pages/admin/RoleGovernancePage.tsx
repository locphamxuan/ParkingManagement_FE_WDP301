import { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { adminApi, type RoleGovernance } from '@/services/admin/adminApi';

const ROLE_META = {
  admin: {
    label: 'Admin · System owner',
    icon: ShieldCheck,
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  manager: {
    label: 'Manager · Building operator',
    icon: Building2,
    tone: 'border-violet-200 bg-violet-50 text-violet-700',
  },
  staff: {
    label: 'Staff · Gate personnel',
    icon: UsersRound,
    tone: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  user: {
    label: 'User · Parking customer',
    icon: UserRound,
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
} as const;

export function RoleGovernancePage() {
  const [data, setData] = useState<RoleGovernance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi.governance.roles()
      .then((response) => {
        if (!cancelled) {
          setData((response as { data?: RoleGovernance }).data ?? null);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Failed to load the role governance matrix.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center gap-2 text-sm font-bold text-slate-500">
        <RefreshCw size={17} className="animate-spin text-blue-600" /> Loading the operating model…
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <section
        className="relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl"
        style={{
          background: 'linear-gradient(90deg, #0052D4 0%, #0072FF 35%, #00C6FF 70%, #99E5FF 100%)',
          boxShadow: '0 16px 48px -10px rgba(0,114,255,0.45), 0 6px 20px -6px rgba(0,0,0,0.12)',
        }}
      >
        {/* Decorative ambient glows */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none blur-xl animate-pulse" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_70%)] pointer-events-none blur-xl" />
        {/* Crystal bevel top */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between max-w-4xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-widest text-white font-mono shadow-sm mb-4">
              Platform governance
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
              Admin is the PBMS system owner
            </h2>
            <p className="mt-3 max-w-2xl text-xs font-semibold text-blue-50/90 leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
              Admin represents the organization that purchased and owns the system:
              administering the building catalog, accounts, staff assignment, consolidated
              finance, reconciliation and logs. Day-to-day operations still belong to
              Manager and Staff.
            </p>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-black text-white uppercase font-mono shadow-md backdrop-blur-md shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>Role matrix</span>
          </div>
        </div>
      </section>


      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-5 xl:grid-cols-2">
        {data?.roles.map((role) => {
          const meta = ROLE_META[role.role];
          const Icon = meta.icon;
          return (
            <article
              key={role.role}
              className="relative overflow-hidden rounded-3xl glass-premium p-5 shadow-md border border-sky-100/80 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] hover:border-blue-500/25 hover:-translate-y-1 group"
            >
              {/* Crystal bevel top border */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${meta.tone} transition-all duration-300 group-hover:scale-110`}>
                  <Icon size={19} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{meta.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{role.purpose}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 transition-colors duration-200 hover:bg-emerald-50/80">
                  <p className="mb-3 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                    <CheckCircle2 size={13} /> Allowed
                  </p>
                  <ul className="space-y-2">
                    {role.capabilities.map((capability) => (
                      <li key={capability} className="flex gap-2 text-[11px] leading-relaxed text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {capability}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4 transition-colors duration-200 hover:bg-rose-50/80">
                  <p className="mb-3 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-rose-700">
                    <LockKeyhole size={13} /> Boundaries
                  </p>
                  <ul className="space-y-2">
                    {role.boundaries.map((boundary) => (
                      <li key={boundary} className="flex gap-2 text-[11px] leading-relaxed text-slate-600">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                        {boundary}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

          );
        })}
      </section>

      <section className="relative overflow-hidden rounded-3xl glass-premium p-6 shadow-md border border-sky-100/80 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(37,99,235,0.07)] hover:border-blue-500/20">
        {/* Crystal bevel top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-500/40 to-indigo-500/10" />
        <div className="mb-5">
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
            <WalletCards size={17} className="text-blue-600" />
            Separation of duties for money flows
          </h3>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            No single role both collects, self-confirms and self-reconciles the same amount of money.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-sky-100/60">
          <table className="w-full min-w-[800px] text-left text-xs">
            <thead className="bg-gradient-to-r from-slate-50/80 to-blue-50/40 text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-sky-100/60">
              <tr>
                <th className="px-5 py-3.5">Business flow</th>
                <th className="px-5 py-3.5">Staff</th>
                <th className="px-5 py-3.5">Manager</th>
                <th className="px-5 py-3.5">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50/80">
              {data?.separationOfDuties.map((flow, idx) => (
                <tr key={flow.flow} className={`transition-colors duration-150 hover:bg-blue-500/[0.03] ${idx % 2 === 0 ? 'bg-white/30' : 'bg-sky-50/20'}`}>
                  <td className="px-5 py-4 font-black text-slate-800">{flow.flow}</td>
                  <td className="px-5 py-4 leading-relaxed text-slate-600">{flow.staff || <span className="text-slate-300 font-mono">—</span>}</td>
                  <td className="px-5 py-4 leading-relaxed text-slate-600">{flow.manager || <span className="text-slate-300 font-mono">—</span>}</td>
                  <td className="px-5 py-4 leading-relaxed text-slate-600">{flow.admin || <span className="text-slate-300 font-mono">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
