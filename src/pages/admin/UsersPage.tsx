import { useMemo, useState } from 'react';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { ModalForm } from '@/components/shared/ModalForm';
import { SearchFilterBar } from '@/components/shared/SearchFilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { useAdminDataset } from '@/hooks/useAdminDataset';
import type { UserRecord } from '@/types';

export function UsersPage() {
  const { data, isLoading, error } = useAdminDataset();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  const filtered = useMemo(() => {
    const source = data?.users ?? [];

    return source.filter((user) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.linkedPlates.some((plate) => plate.toLowerCase().includes(q));
      const matchRole = roleFilter === 'all' || user.role === roleFilter;
      return matchQuery && matchRole;
    });
  }, [data?.users, query, roleFilter]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading users...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Failed to load users.'}</div>;
  }

  const columns: DataColumn<UserRecord>[] = [
    { key: 'name', title: 'User' },
    { key: 'email', title: 'Email' },
    { key: 'role', title: 'Role', render: (row) => <StatusBadge status={row.role} /> },
    { key: 'status', title: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'walletBalance',
      title: 'Wallet Balance',
      render: (row) => `${row.walletBalance.toLocaleString()} VND`,
    },
    {
      key: 'linkedPlates',
      title: 'Linked Plates',
      render: (row) => row.linkedPlates.join(', '),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        filterValue={roleFilter}
        onFilterChange={setRoleFilter}
        filterOptions={['all', 'admin', 'manager', 'staff', 'user']}
      />

      <DataTable title="Users" rows={filtered} columns={columns} />

      <ModalForm
        open={Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        title="User Details"
        onSubmit={() => setSelectedUser(null)}
      >
        {selectedUser ? (
          <div className="grid gap-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Name:</strong> {selectedUser.name}</p>
            <p><strong className="text-foreground">Email:</strong> {selectedUser.email}</p>
            <p><strong className="text-foreground">Role:</strong> {selectedUser.role}</p>
            <p><strong className="text-foreground">Status:</strong> {selectedUser.status}</p>
            <p><strong className="text-foreground">Wallet:</strong> {selectedUser.walletBalance.toLocaleString()} VND</p>
            <p><strong className="text-foreground">Linked plates:</strong> {selectedUser.linkedPlates.join(', ')}</p>
          </div>
        ) : null}
      </ModalForm>
    </div>
  );
}
