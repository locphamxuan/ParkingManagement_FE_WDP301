import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type ManagerBuilding } from '@/services/manager/managerApi';
import { useManagerStore } from '@/store/managerStore';

interface FormState {
  name: string;
  open: string;
  close: string;
  hourlyRate: string;
  dailyCap: string;
  motorcycleMultiplier: string;
  contactPhone: string;
  fullAddress: string;
}

const toForm = (b?: ManagerBuilding): FormState => ({
  name: b?.name ?? '',
  open: b?.operatingHours?.open ?? '06:00',
  close: b?.operatingHours?.close ?? '22:00',
  hourlyRate: String(b?.pricing?.hourlyRate ?? 0),
  dailyCap: b?.pricing?.dailyCap != null ? String(b.pricing.dailyCap) : '',
  motorcycleMultiplier: b?.pricing?.motorcycleMultiplier != null ? String(b.pricing.motorcycleMultiplier) : '0.6',
  contactPhone: b?.contactPhone ?? '',
  fullAddress: b?.address?.fullAddress ?? '',
});

export function ManagerBuildingInfoPage() {
  const { buildingId } = useBuildingContext();
  const { buildings, loadBuildings } = useManagerStore();
  const building = buildings.find((b) => b._id === buildingId);

  const [form, setForm] = useState<FormState>(toForm(building));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setForm(toForm(building));
  }, [building]);

  const onChange =
    (key: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await managerApi.updateBuilding(buildingId, {
        name: form.name.trim(),
        operatingHours: { open: form.open, close: form.close },
        pricing: {
          hourlyRate: Number(form.hourlyRate),
          dailyCap: form.dailyCap ? Number(form.dailyCap) : null,
          motorcycleMultiplier: Number(form.motorcycleMultiplier),
        },
        contactPhone: form.contactPhone.trim(),
        address: { fullAddress: form.fullAddress.trim() },
      });
      await loadBuildings();
      setMessage({ type: 'success', text: 'Cập nhật thông tin tòa nhà thành công.' });
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Lưu thất bại';
      setMessage({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  if (!building) return <div className="text-sm text-muted-foreground">Đang tải...</div>;

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {building.code} · {building.name}
            <StatusBadge status={building.status} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tổng số tầng: <strong className="text-foreground">{building.totalFloors}</strong>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cập nhật thông tin vận hành</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Tên tòa
                </label>
                <Input value={form.name} onChange={onChange('name')} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Số điện thoại
                </label>
                <Input value={form.contactPhone} onChange={onChange('contactPhone')} />
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Địa chỉ
                </label>
                <Input value={form.fullAddress} onChange={onChange('fullAddress')} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Giờ mở
                </label>
                <Input type="time" value={form.open} onChange={onChange('open')} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Giờ đóng
                </label>
                <Input type="time" value={form.close} onChange={onChange('close')} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Giá theo giờ (VND)
                </label>
                <Input type="number" min={0} value={form.hourlyRate} onChange={onChange('hourlyRate')} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Giới hạn ngày (VND)
                </label>
                <Input
                  type="number"
                  min={0}
                  placeholder="không giới hạn"
                  value={form.dailyCap}
                  onChange={onChange('dailyCap')}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Hệ số xe máy
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  value={form.motorcycleMultiplier}
                  onChange={onChange('motorcycleMultiplier')}
                />
              </div>
            </div>

            {message ? (
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {message.text}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
