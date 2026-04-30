'use client';

import { useEffect, useState, useCallback } from 'react';
import type { BarberDto } from '@/types/domain';
import { SkeletonCard } from '@/app/components/Skeleton';
import { useToast } from '@/app/components/Toast';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

// ─── Staff Modal (Create / Edit) ──────────────────────────────────────────────

function StaffModal({
  initial,
  onClose,
  onSave,
  loading,
}: {
  initial?: BarberDto;
  onClose: () => void;
  onSave: (name: string, isActive?: boolean) => Promise<void>;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl p-6 space-y-5 border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-md text-on-surface">{initial ? 'Edit Staff Member' : 'Add New Staff'}</h2>
          <button onClick={onClose} className="text-outline hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="font-label-sm text-tertiary uppercase tracking-wider block mb-1">Full Name</span>
            <input
              id="staff-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline-variant
                text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container
                transition-all placeholder:text-outline"
            />
          </label>

          {initial && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container border border-outline-variant/30">
              <div>
                <p className="font-label-md text-on-surface">Active Status</p>
                <p className="font-body-sm text-tertiary">Inactive staff won&apos;t appear in booking flow</p>
              </div>
              <button
                id="staff-active-toggle"
                onClick={() => setIsActive((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? 'bg-primary-container' : 'bg-surface-container-high'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-outline-variant rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            id="staff-save-btn"
            disabled={loading || !name.trim()}
            onClick={() => onSave(name.trim(), initial ? isActive : undefined)}
            className="flex-1 py-3 bg-primary-container text-on-primary-container rounded-lg font-label-md
              hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" />}
            {initial ? 'Save Changes' : 'Add Staff'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite Panel ─────────────────────────────────────────────────────────────

interface InviteResult {
  deepLink: string;
  expiresAt: string;
  id: string;
}

function InvitePanel() {
  const toast = useToast();
  const [hours, setHours] = useState(72);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInHours: hours }),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? 'Failed to generate invite');
      const d = await res.json();
      setResult(d.invite);
      toast.success('Invite link generated!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate invite');
    } finally {
      setGenerating(false);
    }
  }

  function copyLink() {
    if (!result) return;
    navigator.clipboard.writeText(result.deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard!');
  }

  const expiryOptions = [
    { label: '24 hours', value: 24 },
    { label: '48 hours', value: 48 },
    { label: '72 hours', value: 72 },
    { label: '7 days', value: 168 },
  ];

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 shadow-md shadow-black/5">
      <div className="flex items-center gap-3 mb-4">
        <span className="p-2 bg-surface-container rounded-lg">
          <span className="material-symbols-outlined text-primary-container text-[22px]">link</span>
        </span>
        <div>
          <h3 className="font-headline-sm text-on-surface">Invite Staff</h3>
          <p className="font-body-sm text-tertiary">Generate a one-time invite link</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="font-label-sm text-tertiary uppercase tracking-wider mb-2">Expires in</p>
        <div className="flex flex-wrap gap-2">
          {expiryOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => setHours(o.value)}
              className={`px-3 py-1.5 rounded-lg font-label-sm transition-colors ${
                hours === o.value
                  ? 'bg-primary-container text-on-primary-container'
                  : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <button
        id="generate-invite-btn"
        onClick={generate}
        disabled={generating}
        className="w-full py-3 bg-primary-container text-on-primary-container rounded-lg font-label-md
          hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
      >
        {generating
          ? <span className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" />
          : <span className="material-symbols-outlined text-[18px]">add_link</span>}
        Generate Invite Link
      </button>

      {result && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2 p-3 bg-surface-container rounded-lg border border-outline-variant/30">
            <input
              id="invite-link-output"
              type="text"
              readOnly
              value={result.deepLink}
              className="flex-1 bg-transparent text-on-surface font-body-sm text-sm truncate focus:outline-none"
            />
            <button
              id="copy-invite-btn"
              onClick={copyLink}
              className={`shrink-0 p-1.5 rounded transition-colors ${copied ? 'text-primary' : 'text-outline hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
            </button>
          </div>
          <p className="font-label-sm text-tertiary text-center">
            Expires: {new Date(result.expiresAt).toLocaleString('en-IN')}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────

function StaffCard({
  barber,
  onEdit,
  onDeactivate,
}: {
  barber: BarberDto;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-md shadow-black/5 border border-outline-variant/30 flex flex-col gap-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div className="relative">
          <div className="w-24 h-24 rounded-lg bg-surface-container-high flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[48px] text-primary/30" style={{ fontVariationSettings: "'FILL' 1" }}>
              person
            </span>
          </div>
          <span className={`absolute -bottom-2 -right-2 border text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
            barber.isActive
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-surface-variant text-outline border-outline-variant/30'
          }`}>
            {barber.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-headline-md text-on-surface">{barber.name ?? 'Unnamed'}</h3>
        <p className="font-body-md text-on-surface-variant italic">Staff Member</p>
      </div>

      <div className="pt-4 border-t border-outline-variant/30 mt-auto flex gap-3">
        <button
          id={`edit-staff-${barber.id}`}
          onClick={onEdit}
          className="flex-1 font-label-md py-2 border border-outline text-on-surface-variant rounded-lg hover:bg-surface-container transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Edit
        </button>
        <button
          id={`deactivate-staff-${barber.id}`}
          onClick={onDeactivate}
          title={barber.isActive ? 'Deactivate' : 'Activate'}
          className={`px-3 py-2 border rounded-lg transition-colors ${
            barber.isActive
              ? 'border-outline text-on-surface-variant hover:bg-surface-container'
              : 'border-primary/30 text-primary hover:bg-primary/10'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {barber.isActive ? 'person_off' : 'person'}
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const toast = useToast();
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | BarberDto | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchBarbers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/barbers');
      if (!res.ok) throw new Error('Failed to load staff');
      const d = await res.json();
      setBarbers(d.barbers ?? []);
    } catch {
      setError('Unable to load staff. Check your admin access.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchBarbers();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchBarbers]);

  async function handleSave(name: string, isActive?: boolean) {
    setSaving(true);
    try {
      const isEditing = modal !== 'create' && modal !== null;
      const url = isEditing ? `/api/barbers/${(modal as BarberDto).id}` : '/api/barbers';
      const method = isEditing ? 'PATCH' : 'POST';
      const body: Record<string, unknown> = { name };
      if (isActive !== undefined) body.isActive = isActive;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error?.message ?? 'Failed to save');
      toast.success(isEditing ? 'Staff profile updated.' : 'Staff member added.');
      setModal(null);
      fetchBarbers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(barber: BarberDto) {
    try {
      const res = await fetch(`/api/barbers/${barber.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !barber.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(barber.isActive ? 'Staff deactivated.' : 'Staff activated.');
      fetchBarbers();
    } catch {
      toast.error('Failed to update staff status.');
    }
  }

  return (
    <ErrorBoundary>
      <main className="px-4 md:px-margin-desktop max-w-7xl mx-auto min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-stack-lg gap-4">
          <div className="space-y-1">
            <span className="font-label-md text-primary uppercase tracking-widest block">Team Management</span>
            <h2 className="font-headline-lg text-on-surface">Master Barbers</h2>
          </div>
          <button
            id="add-staff-btn"
            onClick={() => setModal('create')}
            className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container font-label-md rounded-lg shadow-sm hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined">person_add</span>
            ADD NEW STAFF
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            {error}
            <button onClick={fetchBarbers} className="ml-auto underline font-label-sm">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Staff Grid */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                : barbers.length === 0
                  ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3 text-center">
                      <span className="material-symbols-outlined text-[56px] text-surface-variant">badge</span>
                      <p className="font-label-md text-tertiary uppercase tracking-widest">No staff members</p>
                      <button onClick={() => setModal('create')}
                        className="mt-2 px-6 py-3 bg-primary-container text-on-primary-container rounded-lg font-label-md hover:brightness-110 transition-all">
                        Add First Staff Member
                      </button>
                    </div>
                  )
                  : barbers.map((b) => (
                    <StaffCard
                      key={b.id}
                      barber={b}
                      onEdit={() => setModal(b)}
                      onDeactivate={() => handleToggle(b)}
                    />
                  ))}
            </div>
          </div>

          {/* Invite Panel Sidebar */}
          <div className="lg:col-span-4">
            <InvitePanel />
          </div>
        </div>
      </main>

      {modal !== null && (
        <StaffModal
          initial={modal === 'create' ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          loading={saving}
        />
      )}
    </ErrorBoundary>
  );
}