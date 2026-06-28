import { useState } from 'react';
import { Package, Users } from 'lucide-react';
import { ManagerPackagesPage } from '@/pages/manager/ManagerPackagesPage';
import { ManagerSubscriptionsPage } from '@/pages/manager/ManagerSubscriptionsPage';

type Tab = 'packages' | 'subscribers';

const TABS: { key: Tab; label: string; icon: typeof Package }[] = [
  { key: 'packages', label: 'Package list', icon: Package },
  { key: 'subscribers', label: 'Subscribers', icon: Users },
];

/**
 * Consolidates the previous "Packages" and "Customer Packages" screens into one page
 * with sub-tabs to keep the sidebar compact. "Package list" shows the building's
 * long-term package catalog; "Subscribers" lists customers who have purchased packages.
 */
export function ManagerPackagesHubPage() {
  const [tab, setTab] = useState<Tab>('packages');

  return (
    <div className="grid gap-4">
      <div className="flex w-fit gap-1.5 rounded-lg border border-border bg-card p-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = key === tab;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      {tab === 'packages' ? <ManagerPackagesPage /> : <ManagerSubscriptionsPage />}
    </div>
  );
}
