import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';
import { managerApi } from '@/services/managerApi';

export function ManagerVehicleTypesPage() {
  const { session } = useAuth();
  const { selectedBuilding, selectedBuildingId, setSelectedBuildingId, buildings, isLoading, error } = useManagerBuildings();
  const [vehicleTypes, setVehicleTypes] = useState<Array<{ _id: string; name: string; description?: string }>>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadVehicleTypes = useCallback(async () => {
    if (!selectedBuildingId || !session?.token) {
      setVehicleTypes([]);
      return;
    }

    try {
      const types = await managerApi.listVehicleTypes(selectedBuildingId, session.token);
      setVehicleTypes(types);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to load vehicle types.');
    }
  }, [selectedBuildingId, session?.token]);

  useEffect(() => {
    void loadVehicleTypes();
  }, [loadVehicleTypes]);

  const createVehicleType = useCallback(async () => {
    if (!selectedBuildingId || !session?.token || !newTypeName.trim()) {
      setFeedback('Please select a building and enter the vehicle type name.');
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await managerApi.createVehicleType(
        selectedBuildingId,
        { name: newTypeName.trim(), description: newTypeDescription.trim() || undefined },
        session.token,
      );
      setNewTypeName('');
      setNewTypeDescription('');
      await loadVehicleTypes();
      setFeedback('Vehicle type created.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Error creating vehicle type.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedBuildingId, session?.token, newTypeName, newTypeDescription, loadVehicleTypes]);

  const removeType = useCallback(
    async (typeId: string) => {
      if (!selectedBuildingId || !session?.token) return;
      try {
        await managerApi.removeVehicleType(selectedBuildingId, typeId, session.token);
        await loadVehicleTypes();
        setFeedback('Vehicle type deleted.');
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Error deleting vehicle type.');
      }
    },
    [selectedBuildingId, session?.token, loadVehicleTypes],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading buildings...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : buildings.length === 0 ? (
            <p>No building found to manage vehicle types.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-700">Tòa nhà</label>
              <select
                className="w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400"
                value={selectedBuildingId}
                onChange={(event) => setSelectedBuildingId(event.target.value)}
              >
                {buildings.map((building) => (
                  <option key={building._id} value={building._id}>
                    {building.name || building.code || 'Unnamed building'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle types list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            {vehicleTypes.length === 0 ? (
              <p className="text-sm text-slate-600">No vehicle types yet. Add a new one.</p>
          ) : (
            <div className="space-y-3">
              {vehicleTypes.map((type) => (
                <div key={type._id} className="rounded-3xl border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{type.name}</p>
                        {type.description ? <p className="text-sm text-slate-600">{type.description}</p> : null}
                    </div>
                      <Button variant="ghost" size="sm" onClick={() => void removeType(type._id)}>
                        Delete
                      </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
            {feedback ? <p className="text-sm text-slate-700">{feedback}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add new vehicle type</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Type name</label>
            <Input value={newTypeName} onChange={(event) => setNewTypeName(event.target.value)} placeholder="e.g. Motorcycle, Car" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-slate-600">Short description</label>
            <textarea
              value={newTypeDescription}
              onChange={(event) => setNewTypeDescription(event.target.value)}
              className="min-h-[120px] w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400"
              placeholder="You can note price range or vehicle characteristics..."
            />
          </div>
          <Button onClick={createVehicleType} disabled={isSaving || !selectedBuildingId}>
            {isSaving ? 'Creating...' : 'Create vehicle type'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
