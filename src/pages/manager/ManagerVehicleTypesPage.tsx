import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Truck, X, CheckCircle2, Settings } from 'lucide-react';
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

  const customClassesCount = useMemo(() => {
    return items.filter(x => !VEHICLE_PRESETS.some(p => p.code === x.code)).length;
  }, [items]);

  const standardClassesCount = useMemo(() => {
    return items.filter(x => VEHICLE_PRESETS.some(p => p.code === x.code)).length;
  }, [items]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
              Facility Vehicles
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Truck size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
              Vehicle Types
            </h1>
            <p className="mt-1 text-xs font-bold text-slate-500">
              Define and configure allowed vehicle classes, parameters, and type presets.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <Button
              onClick={() => { setShowCreate(true); setFeedback(null); }}
              className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Plus size={14} className="stroke-[3] mr-1.5" /> Add vehicle type
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Low-Profile Summary Row (API Data Powered) */}
      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {[
            { label: 'Total Classes', val: `${items.length} types`, icon: Truck, color: 'text-blue-600 bg-blue-50 border-blue-200', border: 'border-l-blue-500', glow: 'hover:shadow-blue-500/10 hover:border-blue-300' },
            { label: 'Standard Classes', val: `${standardClassesCount} presets`, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', border: 'border-l-emerald-500', glow: 'hover:shadow-emerald-500/10 hover:border-emerald-300' },
            { label: 'Custom Classes', val: `${customClassesCount} custom`, icon: Settings, color: 'text-purple-600 bg-purple-50 border-purple-200', border: 'border-l-purple-500', glow: 'hover:shadow-purple-500/10 hover:border-purple-300' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className={`rounded-2xl border-2 border-l-4 border-slate-100 ${stat.border} bg-white p-4 shadow-sm hover:translate-y-[-2px] ${stat.glow} transition-all duration-200 flex items-center justify-between group select-none`}>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">{stat.label}</p>
                  <p className="mt-1 text-lg font-black text-indigo-950 font-mono group-hover:text-blue-700 transition-colors">{stat.val}</p>
                </div>
                <div className={`p-2 rounded-xl border-2 shrink-0 ${stat.color} group-hover:scale-105 transition-transform duration-250`}>
                  <Icon size={16} className="stroke-[2.5]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {feedback && (
        <div className={`rounded-xl border-2 p-4 text-xs font-bold transition-all duration-200 ${
          feedback.type === 'ok' 
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm' 
            : 'border-rose-200 bg-rose-50 text-rose-700 shadow-sm'
        }`}>
          {feedback.text}
        </div>
      )}

      {/* Form tạo mới */}
      {showCreate && (
        <Card className="border-2 border-blue-200 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-blue-100 bg-blue-50/20 p-5">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-700">Add new vehicle type</CardTitle>
            <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700">
              <X size={16} className="stroke-[2.5]" />
            </button>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 text-slate-800">
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Vehicle type <span className="text-rose-550">*</span></label>
              <select
                value={newPreset}
                onChange={(e) => onPickPreset(e.target.value)}
                className="h-11 rounded-xl border-2 border-blue-100 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500"
              >
                <option value="">— Select vehicle type —</option>
                {VEHICLE_PRESETS.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
                <option value="__other__">Other (custom)</option>
              </select>
            </div>
            {newPreset === '__other__' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Type code <span className="text-rose-550">*</span></label>
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. TRUCK, VAN"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Type name <span className="text-rose-550">*</span></label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Truck, Van"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            )}
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Description</label>
              <Input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Short description (optional)"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={isCreating || !newCode.trim() || !newName.trim()} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 text-xs uppercase tracking-wide transition-all shadow-sm">
                {isCreating ? 'Creating...' : 'Create vehicle type'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="h-10 rounded-xl border-2 border-blue-200 hover:border-blue-300 text-blue-700 font-bold px-4 text-xs uppercase tracking-wide transition-all">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danh sách */}
      <Card className="border-2 border-blue-100 rounded-2xl overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-650 text-xs font-bold p-8 justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
              <span>Loading vehicle configurations...</span>
            </div>
          ) : error ? (
            <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-5">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-xs font-bold text-slate-500 italic p-8 text-center">No vehicle types yet. Tap "Add vehicle type" to start.</p>
          ) : (
            <div className="divide-y divide-blue-50 bg-white">
              {items.map((item) => (
                <div key={item._id} className="p-5 transition-colors hover:bg-slate-50/50">
                  {editId === item._id ? (
                    /* Inline edit form */
                    <div className="grid gap-4 text-slate-800">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Type code</label>
                          <Input value={editCode} onChange={(e) => setEditCode(e.target.value.toUpperCase())} className="h-11 rounded-xl" />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Type name</label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-11 rounded-xl" />
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Description</label>
                        <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-11 rounded-xl" />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button onClick={handleUpdate} disabled={isSaving || !editName.trim()} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 text-xs uppercase tracking-wide shadow-sm">
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button variant="outline" onClick={() => setEditId(null)} className="h-10 rounded-xl border-2 border-blue-200 hover:border-blue-300 text-blue-700 font-bold px-4 text-xs uppercase tracking-wide">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    /* Display row */
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-extrabold text-blue-700">
                            {item.code}
                          </span>
                          <span className="font-extrabold text-slate-800 text-sm">{item.name}</span>
                          {!item.isActive && (
                            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-rose-600">
                              Disabled
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1.5 text-xs text-slate-500 font-medium pl-0.5">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="ghost" className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => startEdit(item)}>
                          <Pencil size={13} className="stroke-[2.5]" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => void handleRemove(item._id)}
                        >
                          <Trash2 size={13} className="stroke-[2.5]" />
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
