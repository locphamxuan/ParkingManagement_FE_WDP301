import { useState } from 'react';
import { Package, UserCheck } from 'lucide-react';
import { ManagerPackagesPage } from '@/pages/manager/ManagerPackagesPage';
import { ManagerCustomersPage } from '@/pages/manager/ManagerCustomersPage';

type Tab = 'packages' | 'customers';

const TABS: { key: Tab; label: string; icon: typeof Package }[] = [
  { key: 'packages', label: 'Packages', icon: Package },
  { key: 'customers', label: 'Customers', icon: UserCheck },
];

/**
 * Gộp 2 màn trước đây ("Gói" + "Khách hàng") thành một trang với sub-tab để
 * gọn sidebar. "Danh sách gói" là danh mục gói dài hạn của tòa nhà; "Customers"
 * là danh bạ user (kèm biển số, để tra cứu lúc xử lý sự cố) + toàn bộ subscription
 * của từng user (xem hạn, phí/hoàn, hủy gói) — tab "Subscribers" cũ đã gộp vào
 * đây 2026-07-22 vì cùng phục vụ 1 user, tách 2 tab gây trùng lặp tra cứu.
 */
export function ManagerPackagesHubPage() {
  const [tab, setTab] = useState<Tab>('packages');

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = key === tab;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {tab === 'packages' ? <ManagerPackagesPage /> : <ManagerCustomersPage />}
    </div>
  );
}
