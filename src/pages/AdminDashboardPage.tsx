import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  adminFlowModules,
  adminKpis,
  auditRows,
  buildingRows,
  guardrails,
  managerAssignments,
  policyPushLogs,
  revenueSnapshots,
  walletSnapshots,
} from '../data/adminFlow';
// Converted to Tailwind utilities; removed CSS module import

const tabConfig = [
  { key: 'overview', title: 'Tong quan', fr: 'FR-ADM-03' },
  { key: 'buildings', title: 'Toa nha', fr: 'FR-ADM-01' },
  { key: 'managers', title: 'Manager', fr: 'FR-ADM-02' },
  { key: 'revenue', title: 'Doanh thu', fr: 'FR-ADM-03' },
  { key: 'wallet', title: 'System wallet', fr: 'FR-ADM-04' },
  { key: 'policies', title: 'Policy push', fr: 'FR-ADM-06' },
  { key: 'audits', title: 'Audit logs', fr: 'FR-ADM-05' },
] as const;

interface AdminDashboardPageProps {
  user?: { fullName?: string; email?: string } | null;
  onLogout: () => void;
  onRefresh: () => void;
}

export default function AdminDashboardPage({ user, onLogout, onRefresh }: AdminDashboardPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const activeTab = useMemo(
    () => (tabConfig.some((tab) => tab.key === tabParam) ? tabParam : 'overview'),
    [tabParam]
  );

  const displayName = user?.fullName || user?.email || 'System Admin';

  const switchTab = (nextTab: string) => {
    setSearchParams({ tab: nextTab });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <section className="bg-white rounded-xl p-6 flex items-start justify-between gap-4 shadow-md">
        <div>
          <p className="text-sm text-gray-500">PBMS Admin Console</p>
          <h2 className="text-2xl font-semibold">Dieu hanh da toa nha cho {displayName}</h2>
          <p className="mt-2 text-sm text-gray-600">Giao dien nay tap trung vao 6 nghiep vu Admin: quan ly toa nha, gan manager, bao cao doanh thu, system wallet, audit logs va policy push.</p>
        </div>

        <div className="flex gap-3">
          <button className="px-3 py-2 rounded-md bg-gray-100" type="button" onClick={onRefresh}>Lam moi ho so</button>
          <button className="px-3 py-2 rounded-md bg-red-600 text-white" type="button" onClick={onLogout}>Dang xuat</button>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-xs text-gray-500">Phan he Admin</p>
            <h3 className="mt-1 font-semibold">Role: ADMIN</h3>
          </div>

          <nav className="space-y-2">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`w-full text-left px-3 py-2 rounded-lg ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                onClick={() => switchTab(tab.key)}
              >
                <div className="flex justify-between items-center">
                  <span>{tab.title}</span>
                  <small className="text-xs text-gray-400">{tab.fr}</small>
                </div>
              </button>
            ))}
          </nav>

          <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
            {adminFlowModules.map((module) => (
              <article key={module.id}>
                <h4 className="font-semibold">{module.title}</h4>
                <p className="text-sm text-gray-500">{module.description}</p>
              </article>
            ))}
          </div>
        </aside>

        <div>
          {activeTab === 'overview' && (
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <div>
                <p className="text-xs text-gray-500">Tong quan van hanh</p>
                <h2 className="text-xl font-semibold">KPI theo ngay</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                {adminKpis.map((item) => (
                  <article key={item.id} className="p-4 rounded-lg bg-gray-50 border">
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <strong className="block mt-2 text-lg">{item.value}</strong>
                    <span className="text-sm text-blue-500 font-semibold">{item.trend}</span>
                  </article>
                ))}
              </div>

              <article className="mt-6 p-4 rounded-lg border bg-white">
                <p className="text-xs text-gray-500">Quy uoc card & parking session</p>
                <h3 className="font-semibold">Systemization rule for account card and walk-in guest</h3>
                <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                  {guardrails.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </article>
            </section>
          )}

          {activeTab === 'buildings' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-01</p>
                  <h2>Danh sach toa nha</h2>
                </div>
                <button className="primary-button" type="button">
                  Them toa nha
                </button>
              </div>

              <div className={styles['table-wrap']}>
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Ten toa</th>
                      <th>Khu vuc</th>
                      <th>Suc chua</th>
                      <th>Gio mo cua</th>
                      <th>Manager</th>
                      <th>Trang thai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildingRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.name}</td>
                        <td>{row.city}</td>
                        <td>{row.capacity}</td>
                        <td>{row.openHours}</td>
                        <td>{row.manager}</td>
                        <td>
                          <span className={`status-pill ${row.status}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'managers' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-02</p>
                  <h2>Gan manager vao toa nha</h2>
                </div>
                <button className="primary-button" type="button">
                  Tao phan cong
                </button>
              </div>

              <div className={styles['assignment-grid']}>
                {managerAssignments.map((item) => (
                  <article className="assignment-card" key={item.account}>
                    <div>
                      <h3>{item.manager}</h3>
                      <p>{item.account}</p>
                    </div>
                    <p>
                      <strong>Toa phu trach:</strong> {item.buildings.join(', ')}
                    </p>
                    <span className={`status-pill ${item.status}`}>{item.status}</span>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'revenue' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-03</p>
                  <h2>Bao cao doanh thu lien toa</h2>
                </div>
              </div>

              <div className={styles['snapshot-grid']}>
                {revenueSnapshots.map((row) => (
                  <article key={row.period} className="snapshot-card">
                    <h3>{row.period}</h3>
                    <p>Gross: {row.gross}</p>
                    <p>Distributed: {row.distribution}</p>
                    <p>Pending: {row.pending}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'wallet' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-04</p>
                  <h2>System wallet and distribution</h2>
                </div>
                <button className="primary-button" type="button">
                  Tao dot phan phoi
                </button>
              </div>

              <div className="wallet-grid">
                {walletSnapshots.map((item) => (
                  <article key={item.label} className="wallet-card">
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'policies' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-06</p>
                  <h2>Policy push logs</h2>
                </div>
                <button className="primary-button" type="button">
                  Push gia moi
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>Actor</th>
                      <th>Building</th>
                      <th>Policy</th>
                      <th>Old</th>
                      <th>New</th>
                      <th>Pushed at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policyPushLogs.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.actor}</td>
                        <td>{row.building}</td>
                        <td>{row.policy}</td>
                        <td>{row.oldValue}</td>
                        <td>{row.newValue}</td>
                        <td>{row.pushedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'audits' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-05</p>
                  <h2>Audit logs</h2>
                </div>
                <button className="ghost-button" type="button">
                  Loc nang cao
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Table</th>
                      <th>Impact</th>
                      <th>At</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.actor}</td>
                        <td>{row.action}</td>
                        <td>{row.target}</td>
                        <td>{row.impact}</td>
                        <td>{row.at}</td>
                        <td>
                          <span className={`status-pill ${row.severity}`}>{row.severity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
