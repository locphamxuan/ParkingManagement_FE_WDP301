import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityTimelineProps {
  title: string;
  items: string[];
}

export function ActivityTimeline({ title, items }: ActivityTimelineProps) {
  return (
    <Card className="border-white/8 bg-slate-950/50 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={item}
              className="relative border-l border-orange-400/30 pl-4 text-[0.92rem] leading-6 text-white"
            >
              <span className="absolute -left-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_4px_rgba(249,115,22,0.14)]" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
