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
      <section className="overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50/90 via-white/80 to-cyan-50/80 p-6 shadow-sm">
        <div className="max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
            Platform governance
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">
            Admin is the PBMS system owner
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Admin represents the organization that purchased and owns the system:
            administering the building catalog, accounts, staff assignment, consolidated
            finance, reconciliation and logs. Day-to-day operations still belong to
            Manager and Staff.
          </p>
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
              className="rounded-3xl border border-sky-100/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl"
            >
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${meta.tone}`}>
                  <Icon size={19} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{meta.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{role.purpose}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
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

                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
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

      <section className="rounded-3xl border border-sky-100/80 bg-white/70 p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-900">
            <WalletCards size={17} className="text-blue-600" />
            Separation of duties for money flows
          </h3>
          <p className="mt-1 text-[10px] font-semibold text-slate-500">
            No single role both collects, self-confirms and self-reconciles the same amount of money.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-xs">
            <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="rounded-l-xl px-4 py-3">Business flow</th>
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Manager</th>
                <th className="rounded-r-xl px-4 py-3">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50">
              {data?.separationOfDuties.map((flow) => (
                <tr key={flow.flow}>
                  <td className="px-4 py-4 font-black text-slate-700">{flow.flow}</td>
                  <td className="px-4 py-4 leading-relaxed text-slate-600">{flow.staff || '—'}</td>
                  <td className="px-4 py-4 leading-relaxed text-slate-600">{flow.manager || '—'}</td>
                  <td className="px-4 py-4 leading-relaxed text-slate-600">{flow.admin || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
