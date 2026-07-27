import { AnimatedParkingMap3D } from '@/components/map/AnimatedParkingMap3D';

const legend = [
  { label: 'Available', dot: 'bg-emerald-500' },
  { label: 'Occupied', dot: 'bg-rose-500' },
];

/**
 * Cột trái trang Auth — chỉ là ngữ cảnh hỗ trợ: 2 chip trạng thái, tiêu đề ngắn
 * và một khung preview bản đồ 3D dùng chung. Không phải dashboard, nên không
 * thêm thẻ số liệu hay copy dài.
 */
export function AuthPromoPanel() {
  return (
    <aside className="flex h-full flex-col border-t border-blue-100 bg-gradient-to-b from-white to-blue-50/40 p-6 lg:border-t-0 lg:border-r lg:p-8 lg:py-10">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-blue-600 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-widest text-white">
          PBMS Control Hub
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-emerald-700">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Systems operational
        </span>
      </div>

      <h2 className="mt-5 text-xl font-black tracking-tight text-slate-900 lg:text-2xl">
        One control hub for every parking building.
      </h2>
      <p className="mt-2.5 text-xs font-bold leading-relaxed text-[#576b85]">
        Sign in to monitor occupancy, run shifts, and keep pricing in order.
      </p>

      {/* Facility preview — the shared 3D map in its decorative compact variant,
          framed as a single contained display so the panel stays light. */}
      <figure className="mt-6 rounded-2xl border border-blue-100 bg-white p-2.5">
        <figcaption className="mb-2 flex items-center justify-between px-1">
          <span className="font-mono text-[9px] font-black uppercase tracking-widest text-slate-500">
            Facility preview
          </span>
          <span className="flex items-center gap-3">
            {legend.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
                <span className="font-mono text-[8px] font-black uppercase tracking-wider text-slate-500">
                  {item.label}
                </span>
              </span>
            ))}
          </span>
        </figcaption>
        <AnimatedParkingMap3D variant="compact" />
      </figure>

      {/* Quiet typographic sign-off — decorative only. */}
      <p
        aria-hidden="true"
        className="mt-auto pt-8 font-mono text-[9px] uppercase tracking-[0.25em] text-blue-600"
      >
        PBMS · Parking Building Management System
      </p>
    </aside>
  );
}
