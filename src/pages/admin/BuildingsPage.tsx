import { useMemo, useState } from "react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { DataTable, type DataColumn } from "@/components/shared/DataTable";
import { ModalForm } from "@/components/shared/ModalForm";
import { SearchFilterBar } from "@/components/shared/SearchFilterBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminDataset } from "@/hooks/admin/useAdminDataset";
import { useAuth } from "@/hooks/useAuth";
import {
  createBuilding,
  deleteBuilding,
  updateBuilding,
  updateBuildingStatus,
} from "@/services/admin/adminCrud";
import type { Building } from "@/types";

const PAGE_SIZE = 3;

export function BuildingsPage() {
  const { data, isLoading, error, refresh } = useAdminDataset();
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteBuilding, setPendingDeleteBuilding] =
    useState<Building | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    floors: "1",
    address: "",
    hourlyRate: "0",
  });

  const filtered = useMemo(() => {
    const source = data?.buildings ?? [];

    return source.filter((item) => {
      const q = query.trim().toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.manager.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data?.buildings, query, statusFilter]);

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading buildings...</div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-sm text-red-600">
        {error || "Failed to load buildings."}
      </div>
    );
  }

  const token = session?.token || "";

  const openCreateModal = () => {
    setActionError(null);
    setSelectedBuilding(null);
    setForm({
      name: "",
      code: "",
      floors: "1",
      address: "",
      hourlyRate: "0",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (building: Building) => {
    setActionError(null);
    setSelectedBuilding(building);
    setForm({
      name: building.name,
      code: building.id,
      floors: String(building.floors),
      address: building.address,
      hourlyRate: "0",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBuilding(null);
    setIsSaving(false);
    setActionError(null);
  };

  const saveBuilding = async () => {
    if (!token) return;
    try {
      setIsSaving(true);
      setActionError(null);
      if (selectedBuilding) {
        await updateBuilding(
          token,
          selectedBuilding.backendId || selectedBuilding.id,
          {
            name: form.name,
            code: form.code,
            totalFloors: Number(form.floors),
            fullAddress: form.address,
          },
        );
      } else {
        await createBuilding(token, {
          name: form.name,
          code: form.code,
          totalFloors: Number(form.floors),
          fullAddress: form.address,
          hourlyRate: Number(form.hourlyRate),
        });
      }
      await refresh();
      closeModal();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to save building",
      );
      setIsSaving(false);
    }
  };

  const toggleBuildingStatus = async (building: Building) => {
    if (!token) return;
    try {
      setActionError(null);
      const nextStatus = building.status === "active" ? "inactive" : "active";
      await updateBuildingStatus(
        token,
        building.backendId || building.id,
        nextStatus,
      );
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to change building status",
      );
    }
  };

  const removeBuildingById = async (building: Building) => {
    if (!token) return;
    setPendingDeleteBuilding(building);
  };

  const confirmRemoveBuilding = async () => {
    if (!token || !pendingDeleteBuilding) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await deleteBuilding(
        token,
        pendingDeleteBuilding.backendId || pendingDeleteBuilding.id,
      );
      await refresh();
      setPendingDeleteBuilding(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to delete building",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DataColumn<Building>[] = [
    { key: "name", title: "Building name" },
    { key: "address", title: "Address" },
    { key: "floors", title: "Floors" },
    {
      key: "occupancyRate",
      title: "Occupancy rate",
      render: (row) => (
        <div className="w-32">
          <div className="mb-1 text-xs text-muted-foreground">
            {row.occupancyRate}%
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{ width: `${row.occupancyRate}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: "manager", title: "Manager" },
    {
      key: "revenueToday",
      title: "Revenue today",
      render: (row) => `${row.revenueToday.toLocaleString()} VND`,
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toggleBuildingStatus(row)}
          >
            {row.status === "active" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeBuildingById(row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      {actionError ? (
        <div className="text-sm text-red-600">{actionError}</div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchFilterBar
          query={query}
          onQueryChange={(value) => {
            setPage(1);
            setQuery(value);
          }}
          filterValue={statusFilter}
          onFilterChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
          filterOptions={[
            "all",
            "active",
            "inactive",
            "maintenance",
            "warning",
          ]}
        />
        <Button onClick={openCreateModal}>Create building</Button>
      </div>

      <DataTable title="Buildings" rows={pageRows} columns={columns} />

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} / {maxPage}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
        >
          Next
        </Button>
      </div>

      <ModalForm
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        title={selectedBuilding ? "Edit building" : "Create building"}
        onSubmit={saveBuilding}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Building name"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <Input
            placeholder="Building code"
            value={form.code}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, code: e.target.value }))
            }
          />
          <Input
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, address: e.target.value }))
            }
          />
          <Input
            placeholder="Floors"
            value={form.floors}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, floors: e.target.value }))
            }
          />
          {!selectedBuilding ? (
            <Input
              placeholder="Hourly rate (VND)"
              value={form.hourlyRate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, hourlyRate: e.target.value }))
              }
            />
          ) : null}
        </div>
        {isSaving ? (
          <p className="text-xs text-muted-foreground">Saving...</p>
        ) : null}
      </ModalForm>

      <ConfirmModal
        open={Boolean(pendingDeleteBuilding)}
        title="Confirm building deletion"
        description={`Are you sure you want to delete building ${pendingDeleteBuilding?.name || ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteBuilding(null);
        }}
        onConfirm={confirmRemoveBuilding}
      />
    </div>
  );
}
