import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ManagerPlaceholderPageProps {
  title: string;
  description: string;
}

export function ManagerPlaceholderPage({ title, description }: ManagerPlaceholderPageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-7 text-slate-600">{description}</p>
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-700">
          This area is reserved for advanced manager modules. Expand it into resource-specific management forms, integrate the `/manager/buildings/:buildingId/...` APIs, and display data scoped to the selected building.
        </div>
      </CardContent>
    </Card>
  );
}
