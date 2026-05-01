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
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-8 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-surface-container-low rounded-lg shadow-technical p-10 space-y-8 border border-white/5">
        <div className="flex items-center justify-between">
          <h2 className="font-display-lg text-2xl text-on-surface lowercase tracking-tighter">{initial ? 'Edit Artisan' : 'New Artisan'}</h2>
          <button onClick={onClose} className="text-on-surface-variant opacity-40 hover:opacity-100 transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-6">
          <label className="block">
            <span className="font-label-md text-on-surface-variant uppercase tracking-[0.2em] text-[10px] opacity-40 block mb-3">Identity</span>
            <input
              id="staff-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-5 py-4 rounded-md bg-surface-container-high border-none
                text-on-surface font-display-lg text-xl focus:ring-1 focus:ring-primary
                transition-all placeholder:text-on-surface-variant/20"
            />
          </label>

          {initial && (
            <div className="flex items-center justify-between p-6 rounded-md bg-surface-container-high/50">
              <div>
                <p className="font-label-md text-on-surface uppercase tracking-widest text-[11px]">Active status</p>
                <p className="font-label-md text-on-surface-variant text-[9px] opacity-40 uppercase tracking-widest mt-1">Availability in system</p>
              </div>
              <button
                id="staff-active-toggle"
                onClick={() => setIsActive((v) => !v)}
                className={`relative w-14 h-7 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-surface-container-highest'}`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-technical transition-transform ${isActive ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 font-label-md text-on-surface-variant uppercase tracking-[0.2em] text-[11px] opacity-40 hover:opacity-100 transition-all"
          >
            Cancel
          </button>
          <button
            id="staff-save-btn"
            disabled={loading || !name.trim()}
            onClick={() => onSave(name.trim(), initial ? isActive : undefined)}
            className="flex-1 py-4 bg-primary text-on-primary rounded-md font-label-md uppercase tracking-[0.2em] text-[11px]
              hover:opacity-90 shadow-technical transition-all disabled:opacity-30 disabled:cursor-not-allowed
              flex items-center justify-center gap-3"
          >
            {loading && <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />}
            {initial ? 'Save Profile' : 'Confirm Artisan'}
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
    { label: '24h', value: 24 },
    { label: '48h', value: 48 },
    { label: '72h', value: 72 },
    { label: '7d', value: 168 },
  ];

  return (
    <div className="bg-surface-container-low rounded-lg p-10 shadow-technical border border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-2 h-full bg-primary/20"></div>
      <div className="flex items-center gap-5 mb-10">
        <div className="w-12 h-12 rounded-md bg-surface-container-high flex items-center justify-center text-primary shadow-technical">
          <span className="material-symbols-outlined text-[24px]">key_visualizer</span>
        </div>
        <div>
          <h3 className="font-display-lg text-xl text-on-surface lowercase tracking-tighter">recruit artisan</h3>
          <p className="font-label-md text-on-surface-variant text-[9px] opacity-40 uppercase tracking-[0.2em] mt-1">One-time authentication link</p>
        </div>
      </div>

      <div className="mb-10">
        <p className="font-label-md text-on-surface-variant uppercase tracking-[0.2em] text-[9px] opacity-40 mb-4">Availability window</p>
        <div className="grid grid-cols-4 gap-3">
          {expiryOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => setHours(o.value)}
              className={`py-3 rounded-md font-label-md text-[10px] uppercase tracking-widest transition-all ${
                hours === o.value
                  ? 'bg-primary text-on-primary shadow-technical'
                  : 'bg-surface-container-high text-on-surface-variant opacity-40 hover:opacity-100'
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
        className="w-full py-5 bg-primary text-on-primary rounded-md font-label-md uppercase tracking-[0.2em] text-[11px]
          hover:opacity-90 shadow-technical transition-all disabled:opacity-30 flex items-center justify-center gap-3 mb-6"
      >
        {generating
          ? <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
          : <span className="material-symbols-outlined text-[18px]">add_link</span>}
        Generate Secret Key
      </button>

      {result && (
        <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
          <div className="flex items-center gap-4 p-5 bg-surface-container-high rounded-md border border-white/5">
            <input
              id="invite-link-output"
              type="text"
              readOnly
              value={result.deepLink}
              className="flex-1 bg-transparent text-on-surface font-label-md text-[11px] truncate focus:outline-none tracking-tight opacity-60"
            />
            <button
              id="copy-invite-btn"
              onClick={copyLink}
              className={`shrink-0 p-2 rounded-md transition-all ${copied ? 'bg-primary text-on-primary shadow-technical' : 'text-on-surface-variant hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
            </button>
          </div>
          <p className="font-label-md text-on-surface-variant text-[9px] uppercase tracking-[0.2em] opacity-40 text-center">
            Valid until {new Date(result.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
    <div className="bg-surface-container-low rounded-lg p-10 shadow-technical transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden border border-white/5">
      <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors duration-500 ${barber.isActive ? 'bg-primary' : 'bg-on-surface-variant/20'}`}></div>
      
      <div className="flex justify-between items-start mb-10">
        <div className="relative">
          <div className="w-20 h-20 rounded-md bg-surface-container-high flex items-center justify-center shadow-technical group-hover:scale-110 transition-transform duration-700">
            <span className="material-symbols-outlined text-[40px] text-primary/20 group-hover:text-primary transition-colors duration-500">
              person
            </span>
          </div>
          <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-surface-container-low ${barber.isActive ? 'bg-primary shadow-[0_0_8px_var(--color-primary)]' : 'bg-on-surface-variant/20'}`}></div>
        </div>
        <div className="text-right">
           <p className="text-[9px] font-label-md uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mb-1">Status</p>
           <p className={`text-[10px] font-bold uppercase tracking-widest ${barber.isActive ? 'text-primary' : 'text-on-surface-variant/40'}`}>
              {barber.isActive ? 'Active' : 'Inactive'}
           </p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-display-lg text-2xl text-on-surface tracking-tighter lowercase">{barber.name ?? 'Unnamed'}</h3>
        <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40">Studio Artisan</p>
      </div>

      <div className="pt-8 border-t border-outline-variant/10 mt-10 flex gap-4">
        <button
          id={`edit-staff-${barber.id}`}
          onClick={onEdit}
          className="flex-1 font-label-md py-3 bg-surface-container-high text-on-surface-variant rounded-md hover:bg-surface-container-highest transition-all uppercase tracking-[0.2em] text-[9px] active:scale-95"
        >
          Manage
        </button>
        <button
          id={`deactivate-staff-${barber.id}`}
          onClick={onDeactivate}
          title={barber.isActive ? 'Deactivate' : 'Activate'}
          className={`px-4 py-3 rounded-md transition-all active:scale-90 ${
            barber.isActive
              ? 'bg-surface-container-high text-on-surface-variant opacity-40 hover:opacity-100'
              : 'bg-primary/10 text-primary shadow-technical'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {barber.isActive ? 'person_off' : 'verified_user'}
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-10 mt-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span className="font-label-md text-on-surface-variant uppercase tracking-[0.3em] text-[10px] opacity-40">Talent Acquisition</span>
            </div>
            <h2 className="font-display-lg text-display-lg text-on-surface tracking-tighter lowercase">master <span className="text-primary">artisans</span></h2>
          </div>
          <button
            id="add-staff-btn"
            onClick={() => setModal('create')}
            className="flex items-center gap-4 px-10 py-5 bg-primary text-on-primary font-label-md rounded-md shadow-technical hover:opacity-90 transition-all uppercase tracking-[0.2em] text-[11px] active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            recruit new talent
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