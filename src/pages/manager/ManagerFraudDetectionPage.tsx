import { useMemo } from 'react';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';

type FraudRow = {
  id: string;
  plateNumber: string;
  gate: string;
  violation: string;
  detectedAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
};

const fraudRows: FraudRow[] = [
  {
    id: 'FRD-001',
    plateNumber: '51A-12345',
    gate: 'Main gate',
    violation: 'Duplicate plate',
    detectedAt: '2026-05-24 08:12',
    status: 'investigating',
  },
  {
    id: 'FRD-002',
    plateNumber: '59B-67890',
    gate: 'Exit A',
    violation: 'Overstay',
    detectedAt: '2026-05-24 09:40',
    status: 'escalated',
  },
  {
    id: 'FRD-003',
    plateNumber: '30AB-11223',
    gate: 'Side gate',
    violation: 'No card tap',
    detectedAt: '2026-05-24 10:05',
    status: 'open',
  },
  {
    id: 'FRD-004',
    plateNumber: '88C-44556',
    gate: 'Entrance B',
    violation: 'Duplicate plate',
    detectedAt: '2026-05-24 10:28',
    status: 'resolved',
  },
];

export function ManagerFraudDetectionPage() {
  const columns: DataColumn<FraudRow>[] = useMemo(
    () => [
      { key: 'plateNumber', title: 'Plate number' },
      { key: 'gate', title: 'Gate' },
      { key: 'violation', title: 'Violation' },
      { key: 'detectedAt', title: 'Detected at' },
      {
        key: 'status',
        title: 'Status',
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    [],
  );

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-sm text-slate-300 shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Manager module</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Fraud detection</h2>
        <p className="mt-2 max-w-3xl leading-6 text-slate-400">
          Temporary view to monitor common violations in the manager operational flow.
        </p>
      </div>

      <DataTable title="Alerts" rows={fraudRows} columns={columns} />
    </div>
  );
}

export default ManagerFraudDetectionPage;