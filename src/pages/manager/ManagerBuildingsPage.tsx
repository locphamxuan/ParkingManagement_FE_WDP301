import { useCallback, useEffect, useState } from 'react';
import { Building2, Save, Layers, Clock, MapPin, Phone, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/select';
import { managerApi, type ManagerBuilding } from '@/services/manager/managerApi';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';

export function ManagerBuildingsPage() {
  const { buildings, selectedBuilding, selectedBuildingId, setSelectedBuildingId, isLoading, error, refreshBuildings } = useManagerBuildings();

  const [name, setName] = useState('');
  const [status, setStatus] = useState<ManagerBuilding['status']>('active');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedBuilding) {
      setName('');
      setStatus('active');
      return;
    }
    setName(selectedBuilding.name || '');
    setStatus(selectedBuilding.status || 'active');
  }, [selectedBuilding]);

  const handleSave = useCallback(async () => {
    if (!selectedBuildingId) {
      setSaveError('No building selected.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const payload: Partial<ManagerBuilding> = {};
      if (name) payload.name = name;
      if (status) payload.status = status;
      await managerApi.updateBuilding(selectedBuildingId, payload);
      await refreshBuildings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update building.');
    } finally {
      setIsSaving(false);
    }
  }, [name, status, selectedBuildingId, refreshBuildings]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Premium Header Hero Card */}
      <div className="premium-hero-card relative overflow-hidden rounded-3xl border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/5 to-indigo-50/10 p-6 shadow-md transition-all duration-300">
        {/* Ambient Glows */}
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-600 text-[9px] font-black uppercase tracking-widest text-white shadow-sm font-mono">
            Infrastructure
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 size={20} className="text-blue-600 animate-pulse stroke-[2.5]" />
            Buildings & Properties
          </h1>
          <p className="mt-1 text-xs font-bold text-slate-500">
            Manage the properties, floor levels, pricing, and operating configurations of your assigned buildings.
          </p>
        </div>
      </div>

      {/* Danh sách tòa nhà */}
      <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30 p-5">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Building2 size={14} className="text-blue-600 stroke-[2.5]" />
            Assigned Buildings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-600 text-xs font-bold py-6 justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span>Loading buildings...</span>
            </div>
          ) : error ? (
            <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 p-3.5 rounded-2xl">{error}</p>
          ) : buildings.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No buildings assigned to this account.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {buildings.map((b) => {
                const isSelected = selectedBuildingId === b._id;
                return (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => setSelectedBuildingId(b._id)}
                    className={`relative rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                      isSelected
                        ? 'border-blue-650 bg-gradient-to-tr from-white via-blue-50/10 to-indigo-50/20 shadow-md scale-[1.01]'
                        : 'border-slate-100 bg-white text-slate-700 hover:border-blue-400 hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Glowing highlight for active selection */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/10 via-blue-600/50 to-indigo-500/10" />
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 border-2 ${isSelected ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                          <Building2 size={18} />
                        </div>
                        <div>
                          <p className={`font-black text-sm tracking-tight ${isSelected ? 'text-blue-800' : 'text-slate-800'}`}>
                            {b.name || 'Building'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">CODE: {b.code}</p>
                        </div>
                      </div>

                      {/* Clean 3D Neon Status Pill */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider select-none ${
                        b.status === 'active' 
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                          : b.status === 'maintenance' 
                            ? 'bg-amber-55/10 border border-amber-250 text-amber-700' 
                            : 'bg-rose-50 border border-rose-200 text-rose-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          b.status === 'active' 
                            ? 'bg-emerald-500 animate-pulse' 
                            : b.status === 'maintenance' 
                              ? 'bg-amber-500' 
                              : 'bg-rose-500'
                        }`} />
                        {b.status === 'active' ? 'Active' : b.status === 'maintenance' ? 'Maintenance' : 'Paused'}
                      </span>
                    </div>

                    {/* Metadata Grid (Complete API Info) */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2.5 text-[11px] font-medium text-slate-500">
                      <div className="flex items-center gap-2">
                        <Layers size={13} className="text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-400">Floors:</span>
                        <span className="font-bold text-slate-900">{b.floorCount} levels</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-400">Hours:</span>
                        <span className="font-bold text-slate-900">
                          {b.operatingHours ? `${b.operatingHours.open} - ${b.operatingHours.close}` : '24/7'}
                        </span>
                      </div>

                      {(b.address?.street || b.address?.fullAddress) && (
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-400">Location:</span>
                          <span className="font-bold text-slate-900 truncate" title={b.address.fullAddress || b.address.street}>
                            {b.address.fullAddress || b.address.street}
                          </span>
                        </div>
                      )}

                      {b.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-400">Contact:</span>
                          <span className="font-bold text-slate-900">{b.contactPhone}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form chỉnh sửa */}
      {selectedBuilding && (
        <Card className="border border-slate-200/80 bg-white shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 p-5">
            <CardTitle className="text-sm font-black uppercase tracking-wider text-slate-700">Update Building Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-5 text-slate-800">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Tên tòa nhà */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Building name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter building name" className="h-11 rounded-xl bg-white border-blue-100 text-slate-800 focus:border-blue-500/40" />
              </div>

              {/* Trạng thái — dropdown */}
              <div className="grid gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Status</label>
                <CustomSelect
                  value={status}
                  onChange={(val) => setStatus(val as ManagerBuilding['status'])}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Paused' },
                    { value: 'maintenance', label: 'Maintenance' },
                  ]}
                />
              </div>
            </div>

            {saveError && (
              <p className="rounded-xl border border-rose-500/25 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600">
                {saveError}
              </p>
            )}
            {saveSuccess && (
              <p className="rounded-xl border border-emerald-500/25 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-600">
                Saved successfully!
              </p>
            )}

            <div className="pt-2">
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-[0.98]">
                {isSaving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="stroke-[2.5] mr-1.5" />}
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
