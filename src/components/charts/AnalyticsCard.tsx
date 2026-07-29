interface AnalyticsCardProps {
  label: string;
  value: string;
  delta: string;
  index?: number;
  icon?: React.ReactNode;
}

const themes = [
  { icon: 'bg-blue-50 text-blue-700 ring-blue-100', line: 'bg-blue-600', detail: 'text-blue-700' },
  { icon: 'bg-violet-50 text-violet-700 ring-violet-100', line: 'bg-violet-600', detail: 'text-violet-700' },
  { icon: 'bg-amber-50 text-amber-700 ring-amber-100', line: 'bg-amber-500', detail: 'text-amber-700' },
  { icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100', line: 'bg-emerald-600', detail: 'text-emerald-700' },
];

/** A deliberately quiet KPI card: one value, one supporting detail and one accent. */
export function AnalyticsCard({ label, value, delta, index = 0, icon }: AnalyticsCardProps) {
  const theme = themes[index % themes.length];

  return (
    <article className="card-3d glass-premium-deep relative min-h-[154px] overflow-hidden rounded-2xl border border-slate-200/80 p-5">
      <span className={`absolute inset-x-5 top-0 h-1 rounded-b-full ${theme.line}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-3 truncate text-3xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
        {icon ? (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${theme.icon}`}>
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
        <span className={`h-1.5 w-1.5 rounded-full ${theme.line}`} />
        <span className={`text-xs font-semibold ${theme.detail}`}>{delta}</span>
      </div>
    </article>
  );
}
