'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ServiceDto } from '@/types/domain';
import { SkeletonServiceCard } from '@/app/components/Skeleton';
import { useToast } from '@/app/components/Toast';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ServiceFormValues {
  name: string;
  durationMinutes: string;
  price: string;
}

function ServiceModal({
  initial,
  onClose,
  onSave,
  loading,
}: {
  initial?: ServiceDto;
  onClose: () => void;
  onSave: (v: ServiceFormValues) => Promise<void>;
  loading: boolean;
}) {
  const [values, setValues] = useState<ServiceFormValues>({
    name: initial?.name ?? '',
    durationMinutes: String(initial?.durationMinutes ?? 30),
    price: String(initial?.price ?? ''),
  });

  function set(k: keyof ServiceFormValues, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-surface-container-low rounded-lg shadow-technical border border-white/5 overflow-hidden">
        <div className="px-10 py-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-high/20">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span className="text-[9px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Protocol Definition</span>
            </div>
            <h3 className="font-display-lg text-3xl text-on-surface tracking-tighter lowercase">
              {initial ? 'modify sequence' : 'initialize sequence'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant opacity-40 hover:opacity-100 transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <div className="p-10 space-y-10">
          <div className="space-y-3">
            <label className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40 block ml-1">service identifier</label>
            <input
              type="text"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. precise contouring"
              className="w-full bg-surface-container-high/50 border border-white/5 rounded-sm px-6 py-4 text-on-surface font-display-lg text-xl tracking-tighter placeholder:text-on-surface/20 focus:bg-surface-container-high transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40 block ml-1">temporal scope (min)</label>
              <input
                type="number"
                value={values.durationMinutes}
                onChange={(e) => set('durationMinutes', e.target.value)}
                className="w-full bg-surface-container-high/50 border border-white/5 rounded-sm px-6 py-4 text-on-surface font-display-lg text-xl tracking-tighter focus:bg-surface-container-high transition-all outline-none"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40 block ml-1">valuation (₹)</label>
              <input
                type="number"
                value={values.price}
                onChange={(e) => set('price', e.target.value)}
                className="w-full bg-surface-container-high/50 border border-white/5 rounded-sm px-6 py-4 text-on-surface font-display-lg text-xl tracking-tighter text-primary focus:bg-surface-container-high transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-10 bg-surface-container-high/10 border-t border-outline-variant/10 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-5 rounded-sm font-label-md uppercase tracking-[0.2em] text-[11px] text-on-surface-variant opacity-40 hover:opacity-100 transition-all"
          >
            abort
          </button>
          <button
            disabled={loading || !values.name || !values.price}
            onClick={() => onSave(values)}
            className="flex-1 py-5 bg-primary text-on-primary rounded-sm shadow-technical font-label-md uppercase tracking-[0.2em] text-[11px] hover:opacity-90 transition-all disabled:opacity-20 active:scale-95 flex items-center justify-center gap-3"
          >
            {loading && <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />}
            {initial ? 'commit changes' : 'execute initialization'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  service,
  onConfirm,
  onCancel,
  loading,
}: {
  service: ServiceDto;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-2xl p-6 space-y-4
        border border-outline-variant/30">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-error text-[32px]"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            delete_forever
          </span>
          <div>
            <h3 className="font-headline-sm text-on-surface">Delete Service</h3>
            <p className="font-body-sm text-tertiary">This action cannot be undone.</p>
          </div>
        </div>
        <p className="font-body-md text-on-surface-variant">
          Are you sure you want to delete <strong className="text-on-surface">{service.name}</strong>?
          It will no longer be available for bookings.
        </p>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-outline-variant rounded-lg font-label-md
              text-on-surface-variant hover:bg-surface-container transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-error text-on-error rounded-lg font-label-md
              hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <span className="w-4 h-4 border-2 border-on-error/30 border-t-on-error
              rounded-full animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  onEdit,
  onToggle,
  onDelete,
}: {
  service: ServiceDto & { isActive?: boolean };
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`bg-surface-container-low rounded-lg p-8 border border-white/5 flex flex-col gap-6
      shadow-technical transition-all hover:bg-surface-container-high group
      ${service.isActive === false ? 'opacity-40 grayscale' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-md bg-surface-container-high flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
          <span className="material-symbols-outlined text-[20px]">
            content_cut
          </span>
        </div>
        <div className={`px-4 py-1 rounded-sm text-[9px] font-label-md uppercase tracking-[0.2em] border
          ${service.isActive === false
            ? 'border-on-surface-variant/20 text-on-surface-variant opacity-40'
            : 'border-primary/20 text-primary bg-primary/5'}`}>
          {service.isActive === false ? 'off-line' : 'operational'}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-display-lg text-2xl text-on-surface lowercase tracking-tighter leading-tight group-hover:text-primary transition-colors">{service.name}</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {service.durationMinutes} min
          </div>
          <span className="w-1 h-1 bg-on-surface-variant rounded-full opacity-10"></span>
          <span className="font-display-lg text-xl text-primary tracking-tighter">
            ₹{service.price.toFixed(0)}
          </span>
        </div>
      </div>

      <div className="flex gap-3 mt-auto pt-6 border-t border-outline-variant/10">
        <button
          onClick={onEdit}
          className="flex-1 py-3 bg-surface-container-high rounded-sm text-[10px] font-label-md uppercase tracking-[0.2em] text-on-surface-variant hover:text-on-surface transition-all active:scale-95"
        >
          Modify
        </button>
        <button
          onClick={onToggle}
          className="w-12 h-10 flex items-center justify-center rounded-sm bg-surface-container-high text-on-surface-variant opacity-40 hover:opacity-100 transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-[18px]">
            {service.isActive === false ? 'visibility' : 'visibility_off'}
          </span>
        </button>
        <button
          onClick={onDelete}
          className="w-12 h-10 flex items-center justify-center rounded-sm bg-error/5 text-error opacity-40 hover:opacity-100 transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ServiceWithActive = ServiceDto & { isActive?: boolean };

export default function ServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState<ServiceWithActive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | ServiceWithActive | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceWithActive | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/services');
      if (!res.ok) throw new Error('Failed to load services');
      const d = await res.json();
      setServices(d.services ?? []);
    } catch {
      setError('Unable to load services. Check your connection or admin access.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchServices();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchServices]);

  async function handleSave(values: ServiceFormValues) {
    setSaving(true);
    try {
      const isEditing = modal !== 'create' && modal !== null;
      const url = isEditing ? `/api/services/${(modal as ServiceWithActive).id}` : '/api/services';
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          durationMinutes: Number(values.durationMinutes),
          price: Number(values.price),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? 'Failed to save');
      toast.success(isEditing ? 'Service updated.' : 'Service created.');
      setModal(null);
      fetchServices();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(svc: ServiceWithActive) {
    try {
      const res = await fetch(`/api/services/${svc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !(svc.isActive !== false) }),
      });
      if (!res.ok) throw new Error();
      toast.success(svc.isActive === false ? 'Service activated.' : 'Service deactivated.');
      fetchServices();
    } catch {
      toast.error('Failed to update service status.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/services/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Service deleted.');
      setDeleteTarget(null);
      fetchServices();
    } catch {
      toast.error('Failed to delete service.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ErrorBoundary>
      <main className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto min-h-screen pb-24">
        {/* Header */}
        <section className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-10 mt-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
               <span className="font-label-md text-on-surface-variant uppercase tracking-[0.3em] text-[10px] opacity-40">Artisan Assets</span>
            </div>
            <h2 className="font-display-lg text-display-lg text-on-surface tracking-tighter lowercase">service <span className="text-primary">catalogue</span></h2>
            <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40">Managing {services.length} operational definitions</p>
          </div>
          <button
            onClick={() => setModal('create')}
            className="px-10 py-5 bg-primary text-on-primary rounded-md shadow-technical font-label-md uppercase tracking-[0.2em] text-[11px] hover:opacity-90 transition-all flex items-center gap-3 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            initialize new sequence
          </button>
        </section>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error
            text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            {error}
            <button onClick={fetchServices} className="ml-auto underline font-label-sm">Retry</button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonServiceCard key={i} />)
            : services.length === 0
              ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <span className="material-symbols-outlined text-[56px] text-surface-variant">
                    content_cut
                  </span>
                  <p className="font-label-md text-tertiary uppercase tracking-widest">No services yet</p>
                  <p className="font-body-md text-on-surface-variant max-w-xs">
                    Create your first service to start accepting bookings.
                  </p>
                  <button onClick={() => setModal('create')}
                    className="mt-2 px-6 py-3 bg-primary-container text-on-primary-container rounded-lg
                      font-label-md hover:brightness-110 transition-all">
                    Create First Service
                  </button>
                </div>
              )
              : services.map((svc) => (
                <ServiceCard
                  key={svc.id}
                  service={svc}
                  onEdit={() => setModal(svc)}
                  onToggle={() => handleToggle(svc)}
                  onDelete={() => setDeleteTarget(svc)}
                />
              ))}
        </div>
      </main>

      {/* Modals */}
      {modal !== null && (
        <ServiceModal
          initial={modal === 'create' ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={saving}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          service={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={saving}
        />
      )}
    </ErrorBoundary>
  );
}
