import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Truck, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type VehicleType } from '@/services/manager/managerApi';
import { VEHICLE_PRESETS } from '@/constants/vehiclePresets';

export function ManagerVehicleTypesPage() {
  const { buildingId } = useBuildingContext();

  const [items, setItems] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Form tạo mới
  const [showCreate, setShowCreate] = useState(false);
  const [newPreset, setNewPreset] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Chọn preset → tự điền mã + tên. "Khác" (__other__) → cho nhập tay.
  const onPickPreset = (val: string) => {
    setNewPreset(val);
    if (val === '__other__') { setNewCode(''); setNewName(''); return; }
    const p = VEHICLE_PRESETS.find((x) => x.code === val);
    if (p) { setNewCode(p.code); setNewName(p.name); }
  };

  // Form chỉnh sửa
  const [editId, setEditId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await managerApi.vehicleTypes.list(buildingId);
      setItems((res as { data?: { items: VehicleType[] } })?.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load vehicle types.');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => { void load(); }, [load]);

  const handleCreate = async () => {
    if (!newCode.trim() || !newName.trim()) {
      setFeedback({ type: 'err', text: 'Vehicle type code and name are required.' });
      return;
    }
    setIsCreating(true);
    setFeedback(null);
    try {
      await managerApi.vehicleTypes.create(buildingId, {
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setNewPreset('');
      setNewCode('');
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      setFeedback({ type: 'ok', text: 'Vehicle type created successfully.' });
      await load();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Error creating vehicle type.' });
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (item: VehicleType) => {
    setEditId(item._id);
    setEditCode(item.code);
    setEditName(item.name);
    setEditDesc(item.description ?? '');
    setFeedback(null);
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      await managerApi.vehicleTypes.update(buildingId, editId, {
        code: editCode.trim().toUpperCase(),
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      setEditId(null);
      setFeedback({ type: 'ok', text: 'Vehicle type updated successfully.' });
      await load();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Error updating.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    setFeedback(null);
    try {
      await managerApi.vehicleTypes.remove(buildingId, id);
      setFeedback({ type: 'ok', text: 'Vehicle type deleted.' });
      await load();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Error deleting.' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground">Vehicle types</h2>
        </div>
        <Button size="sm" className="gap-2" onClick={() => { setShowCreate(true); setFeedback(null); }}>
          <Plus size={14} /> Add vehicle type
        </Button>
      </div>

      {feedback && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${feedback.type === 'ok' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600' : 'border-rose-500/25 bg-rose-500/10 text-rose-500'}`}>
          {feedback.text}
        </div>
      )}

      {/* Form tạo mới */}
      {showCreate && (
        <Card className="border-primary/25">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Add new vehicle type</CardTitle>
            <button type="button" onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vehicle type <span className="text-rose-400">*</span></label>
              <select
                value={newPreset}
                onChange={(e) => onPickPreset(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
              >
                <option value="">— Select vehicle type —</option>
                {VEHICLE_PRESETS.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
                <option value="__other__">Other (custom)</option>
              </select>
            </div>
            {newPreset === '__other__' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type code <span className="text-rose-400">*</span></label>
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TRUCK, VAN"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type name <span className="text-rose-400">*</span></label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Truck, Van"
                  />
                </div>
              </div>
            )}
            <div className="grid gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Short description (optional)"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={isCreating || !newCode.trim() || !newName.trim()}>
                {isCreating ? 'Creating...' : 'Create vehicle type'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danh sách */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-5 text-sm text-muted-foreground">Loading...</p>
          ) : error ? (
            <p className="p-5 text-sm text-rose-500">{error}</p>
          ) : items.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No vehicle types yet. Tap "Add vehicle type" to start.</p>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item._id} className="p-4">
                  {editId === item._id ? (
                    /* Inline edit form */
                    <div className="grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Type code</label>
                          <Input value={editCode} onChange={(e) => setEditCode(e.target.value.toUpperCase())} />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Type name</label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Description</label>
                        <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdate} disabled={isSaving || !editName.trim()}>
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    /* Display row */
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                            {item.code}
                          </span>
                          <span className="font-semibold text-foreground">{item.name}</span>
                          {!item.isActive && (
                            <span className="rounded border border-rose-500/25 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-500">
                              Disable
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => startEdit(item)}>
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600"
                          onClick={() => void handleRemove(item._id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
