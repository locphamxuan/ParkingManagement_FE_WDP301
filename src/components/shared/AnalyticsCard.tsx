import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsCardProps {
  label: string;
  value: string;
  delta: string;
  index?: number;
}

export function AnalyticsCard({ label, value, delta, index = 0 }: AnalyticsCardProps) {
  const isPositive = !delta.includes('-');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Card className="h-full relative overflow-hidden border border-stone-200/40 bg-white/60 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-primary/20">
        <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br from-primary/8 to-orange-400/8 blur-xl pointer-events-none" />
        <CardHeader className="pb-2 p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-500">{label}</p>
          <CardTitle className="mt-2 text-2xl font-black tracking-tight text-stone-850">{value}</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isPositive 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/30' 
                : 'bg-rose-50 text-rose-700 border border-rose-200/30'
            }`}>
              {delta}
            </span>
            <span className="text-[11px] font-medium text-stone-400">so với tháng trước</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

