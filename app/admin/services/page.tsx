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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-6 space-y-5
        border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-on-surface">
            {initial ? 'Edit Service' : 'New Service'}
          </h2>
          <button onClick={onClose} className="text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="font-label-sm text-tertiary uppercase tracking-wider block mb-1">
              Service Name
            </span>
            <input
              id="svc-name"
              type="text"
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Classic Haircut"
              className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline-variant
                text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container
                transition-all placeholder:text-outline"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="font-label-sm text-tertiary uppercase tracking-wider block mb-1">
                Duration (min)
              </span>
              <input
                id="svc-duration"
                type="number"
                min={5}
                max={480}
                step={5}
                value={values.durationMinutes}
                onChange={(e) => set('durationMinutes', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline-variant
                  text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container
                  transition-all"
              />
            </label>
            <label className="block">
              <span className="font-label-sm text-tertiary uppercase tracking-wider block mb-1">
                Price (₹)
              </span>
              <input
                id="svc-price"
                type="number"
                min={0}
                step={0.5}
                value={values.price}
                onChange={(e) => set('price', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline-variant
                  text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container
                  transition-all"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-outline-variant rounded-lg font-label-md
              text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            id="svc-save"
            disabled={loading || !values.name || !values.price}
            onClick={() => onSave(values)}
            className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-lg
              font-label-md hover:brightness-110 transition-all disabled:opacity-50
              disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-on-primary-container/30
              border-t-on-primary-container rounded-full animate-spin" />}
            {initial ? 'Save Changes' : 'Create Service'}
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
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
    <div className={`bg-surface-container-lowest rounded-xl p-6 border flex flex-col gap-4
      shadow-md shadow-black/5 transition-all hover:shadow-lg group
      ${service.isActive === false ? 'border-outline-variant/20 opacity-60' : 'border-outline-variant/30'}`}>
      <div className="flex items-start justify-between">
        <div className="p-2.5 bg-surface-container rounded-lg">
          <span className="material-symbols-outlined text-primary-container text-[24px]">
            content_cut
          </span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase
          ${service.isActive === false
            ? 'bg-surface-variant text-outline'
            : 'bg-primary/10 text-primary'}`}>
          {service.isActive === false ? 'Inactive' : 'Active'}
        </span>
      </div>

      <div>
        <h3 className="font-headline-sm text-on-surface">{service.name}</h3>
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 font-label-sm text-tertiary">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {service.durationMinutes} min
          </span>
          <span className="text-outline-variant">·</span>
          <span className="font-label-md text-primary font-semibold">
            ₹{service.price.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-auto pt-4 border-t border-outline-variant/30">
        <button
          id={`edit-svc-${service.id}`}
          onClick={onEdit}
          className="flex-1 py-2 border border-outline-variant text-on-surface-variant rounded-lg
            font-label-sm hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Edit
        </button>
        <button
          id={`toggle-svc-${service.id}`}
          onClick={onToggle}
          title={service.isActive === false ? 'Activate' : 'Deactivate'}
          className="px-3 py-2 border border-outline-variant text-on-surface-variant rounded-lg
            hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            {service.isActive === false ? 'visibility' : 'visibility_off'}
          </span>
        </button>
        <button
          id={`delete-svc-${service.id}`}
          onClick={onDelete}
          className="px-3 py-2 border border-error/30 text-error rounded-lg hover:bg-error/10 transition-colors"
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
      <main className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-stack-lg gap-4">
          <div className="space-y-1">
            <span className="font-label-md text-primary tracking-widest uppercase block">
              Service Catalogue
            </span>
            <h2 className="font-headline-lg text-on-surface">Manage Services</h2>
          </div>
          <button
            id="create-service-btn"
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container
              font-label-md rounded-lg shadow-md hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            NEW SERVICE
          </button>
        </div>

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
