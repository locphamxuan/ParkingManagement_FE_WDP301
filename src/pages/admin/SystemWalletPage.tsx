import { useCallback, useEffect, useState } from 'react';
import {
  Wallet, TrendingDown, RefreshCw, AlertTriangle, Plus, Pencil, Trash2,
  CheckCircle2, Star, X, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalForm } from '@/components/shared/ModalForm';
import {
  adminApi,
  type SystemWallet,
  type WalletDistribution,
  type AdminSubscriptionPackage,
} from '@/services/admin/adminApi';

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('en-US')} ₫` : '—';
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });

interface PkgForm {
  name: string; price: string; durationDays: string;
  description: string; features: string; isActive: boolean;
}
const emptyForm: PkgForm = { name: '', price: '', durationDays: '30', description: '', features: '', isActive: true };

export function SystemWalletPage() {
  const [wallet, setWallet] = useState<SystemWallet | null>(null);
  const [distributions, setDistributions] = useState<WalletDistribution[]>([]);
  const [packages, setPackages] = useState<AdminSubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<AdminSubscriptionPackage | null>(null);
  const [form, setForm] = useState<PkgForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, distRes, pkgRes] = await Promise.all([
        adminApi.wallet.get(),
        adminApi.wallet.distributions(),
        adminApi.subscriptionPackages.list(),
      ]);
      setWallet((walletRes as any)?.data?.wallet ?? null);
      setDistributions((distRes as any)?.data?.items ?? []);
      setPackages((pkgRes as any)?.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openCreate = () => {
    setEditingPkg(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (pkg: AdminSubscriptionPackage) => {
    setEditingPkg(pkg);
    setForm({
      name: pkg.name,
      price: String(pkg.price),
      durationDays: String(pkg.durationDays),
      description: pkg.description ?? '',
      features: pkg.features.join(', '),
      isActive: pkg.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<AdminSubscriptionPackage> = {
        name: form.name.trim(),
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        description: form.description.trim(),
        features: form.features.split(',').map((s) => s.trim()).filter(Boolean),
        isActive: form.isActive,
      };
      if (editingPkg) {
        await adminApi.subscriptionPackages.update(editingPkg._id, payload);
        setSuccessMsg('Package updated.');
      } else {
        await adminApi.subscriptionPackages.create(payload);
        setSuccessMsg('Package created.');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this subscription package?')) return;
    try {
      await adminApi.subscriptionPackages.remove(id);
      setSuccessMsg('Package deleted.');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw size={14} className="animate-spin" /> Loading system wallet...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet size={22} className="text-orange-400" />
          <div>
            <h2 className="text-base font-bold text-white">System Wallet</h2>
            <p className="text-xs text-muted-foreground">
              Platform wallet — receives manager subscription payments
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={refresh} className="gap-2 text-xs">
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertTriangle size={14} className="shrink-0" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={13} /></button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 size={14} className="shrink-0" /> {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-auto"><X size={13} /></button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Balance</p>
            <p className="mt-2 text-3xl font-bold text-white">{fmtVnd(wallet?.balance)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated: {wallet?.updatedAt ? fmtTime(wallet.updatedAt) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70">Total Distributed</p>
            <p className="mt-2 text-3xl font-bold text-amber-400">{fmtVnd(wallet?.totalDistributed)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Cumulative amount distributed to buildings</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Packages Management */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <Star size={15} className="text-amber-400" />
              Subscription Packages
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="gap-1.5 text-xs">
              <Plus size={12} /> Add Package
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscription packages yet. Create one for managers to subscribe.</p>
          ) : (
            <div className="grid gap-2">
              {packages.map((pkg) => (
                <div key={pkg._id}
                  className="flex items-start justify-between rounded-lg border border-white/8 bg-white/3 px-4 py-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white text-sm">{pkg.name}</p>
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-full ${pkg.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400'}`}>
                        {pkg.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{pkg.description}</p>
                    <div className="flex items-center gap-3 text-xs mt-1">
                      <span className="font-black text-amber-400">{fmtVnd(pkg.price)}</span>
                      <span className="text-muted-foreground">{pkg.durationDays} days</span>
                    </div>
                    {pkg.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {pkg.features.map((f, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(pkg)}><Pencil size={13} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(pkg._id)}><Trash2 size={13} /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution history */}
      {distributions.length > 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <TrendingDown size={15} className="text-orange-400" />
              Distribution History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {distributions.map((d) => (
                <div key={d._id}
                  className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {d.building?.code} · {d.building?.name}
                    </p>
                    {d.note && <p className="text-xs text-muted-foreground">{d.note}</p>}
                    <p className="text-xs text-muted-foreground">{fmtTime(d.createdAt)}</p>
                  </div>
                  <p className="font-mono font-bold text-amber-400">-{fmtVnd(d.amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Package form modal */}
      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editingPkg ? 'Edit Package' : 'New Subscription Package'}
        onSubmit={handleSave}
      >
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Package Name</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Monthly Basic" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price (VND)</label>
              <Input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="500000" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration (days)</label>
              <Input type="number" min={1} value={form.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))} placeholder="30" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What's included..." />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Features (comma-separated)</label>
            <Input value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} placeholder="24/7 support, Analytics dashboard, ..." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pkg-active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
            <label htmlFor="pkg-active" className="text-xs text-muted-foreground">Active (visible to managers)</label>
          </div>
          {saving && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 size={12} className="animate-spin" /> Saving...</div>}
        </div>
      </ModalForm>
    </div>
  );
}
