'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import type { QueueTokenDto, BarberDto } from '@/types/domain';

type QueueFilter = 'waiting' | 'assigned' | 'completed' | 'cancelled' | 'all';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    waiting: 'bg-primary text-on-primary',
    assigned: 'bg-surface-container-high text-primary border-primary/20',
    completed: 'bg-surface-container-high text-on-surface-variant opacity-40',
    cancelled: 'bg-error/10 text-error border-error/20',
  };
  return (
    <span className={`px-4 py-1 rounded-sm font-label-md uppercase tracking-[0.2em] text-[9px] border border-transparent ${cfg[status] ?? 'bg-surface-container text-on-surface-variant opacity-40'}`}>
      {status}
    </span>
  );
}

export default function QueuePage() {
  const [tokens, setTokens] = useState<QueueTokenDto[]>([]);
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<QueueFilter>('waiting');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<{ tokenId: string; show: boolean } | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ queueDate: today, limit: '50' });
      if (filter !== 'all') params.set('status', filter);
      const [qRes, bRes] = await Promise.all([
        fetch(`/api/queue?${params}`),
        fetch('/api/barbers'),
      ]);
      if (qRes.ok) {
        const d = await qRes.json();
        setTokens(d.data ?? []);
      }
      if (bRes.ok) {
        const d = await bRes.json();
        setBarbers(d.barbers ?? []);
      }
    } catch {
      setError('Failed to load queue data.');
    } finally {
      setLoading(false);
    }
  }, [today, filter]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchQueue();
    }, 0);
    // Auto-refresh every 30s
    const interval = setInterval(fetchQueue, 30_000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [fetchQueue]);

  const handleComplete = async (tokenId: string) => {
    setActionLoading(tokenId);
    setError(null);
    try {
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      const res = await fetch(`/api/queue/${tokenId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotency_key: `complete-${tokenId}-${now}` }),
      });
      if (!res.ok) throw new Error('Failed to complete token');
      await fetchQueue();
    } catch {
      setError('Could not update queue entry.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssign = async (tokenId: string, barberId: string) => {
    setActionLoading(tokenId);
    setError(null);
    setAssignTarget(null);
    try {
      // eslint-disable-next-line react-hooks/purity
      const now = Date.now();
      const res = await fetch(`/api/queue/${tokenId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId,
          idempotency_key: `assign-${tokenId}-${barberId}-${now}`,
        }),
      });
      if (!res.ok) throw new Error('Failed to assign token');
      await fetchQueue();
    } catch {
      setError('Could not assign barber.');
    } finally {
      setActionLoading(null);
    }
  };

  const waitingCount = tokens.filter((t) => t.status === 'waiting').length;
  const assignedCount = tokens.filter((t) => t.status === 'assigned').length;

  return (
    <main className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto min-h-screen pb-24">
      {/* Header */}
      <section className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-10 mt-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
             <span className="font-label-md text-on-surface-variant uppercase tracking-[0.3em] text-[10px] opacity-40">Live Feed</span>
          </div>
          <h2 className="font-display-lg text-display-lg text-on-surface tracking-tighter lowercase">operational <span className="text-primary">queue</span></h2>
          <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40">{today}</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-md shadow-technical border border-white/5">
          <div className="flex items-center gap-3 px-6 py-2 border-r border-outline-variant/10">
            <span className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-[0.2em] opacity-40">Auto-refresh 30s</span>
          </div>
          <button
            onClick={fetchQueue}
            className="w-10 h-10 flex items-center justify-center rounded-sm hover:bg-surface-container-high transition-all active:scale-90 text-on-surface-variant opacity-40 hover:opacity-100"
            title="Force refresh"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
        {[
          { label: 'Awaiting', value: waitingCount, icon: 'hourglass_top', color: 'text-primary' },
          { label: 'Assigned', value: assignedCount, icon: 'terminal', color: 'text-primary' },
          { label: 'Completed', value: tokens.filter((t) => t.status === 'completed').length, icon: 'verified', color: 'text-on-surface-variant opacity-40' },
          { label: 'Aggregate', value: tokens.length, icon: 'database', color: 'text-primary' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface-container-low p-10 rounded-lg shadow-technical border border-white/5 transition-all hover:bg-surface-container-high group">
            <span className={`material-symbols-outlined ${color} text-[20px] block mb-4 group-hover:scale-110 transition-transform`}>{icon}</span>
            <p className="font-display-lg text-display-lg text-on-surface tracking-tighter leading-none">{loading ? '—' : value}</p>
            <p className="font-label-md text-on-surface-variant uppercase tracking-[0.2em] text-[10px] mt-4 opacity-40 group-hover:opacity-100 transition-opacity">{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">{error}</div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-12 overflow-x-auto no-scrollbar">
        {(['all', 'waiting', 'assigned', 'completed', 'cancelled'] as QueueFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-8 py-3 rounded-md font-label-md uppercase tracking-[0.2em] text-[10px] transition-all border ${
              filter === f
                ? 'bg-primary text-on-primary border-primary shadow-technical'
                : 'bg-surface-container-low border-white/5 text-on-surface-variant opacity-60 hover:opacity-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-surface-container-low animate-pulse border border-white/5 shadow-technical" />
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-32 bg-surface-container-low rounded-lg shadow-technical border border-white/5">
          <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant opacity-20">database</span>
          </div>
          <p className="font-display-lg text-2xl text-on-surface lowercase tracking-tighter mb-2">no active dossiers</p>
          <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-[0.2em] opacity-40">
            {filter === 'waiting' ? 'the buffer is currently empty.' : `no entries detected for state: ${filter}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {tokens.map((token, idx) => {
            const assignedBarber = barbers.find((b) => b.id === token.barberId);
            const isActing = actionLoading === token.id;
            const createdAt = new Date(token.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={token.id}
                className="bg-surface-container-low rounded-lg p-8 border border-white/5 shadow-technical flex flex-col md:flex-row gap-10 items-start md:items-center group hover:bg-surface-container-high transition-all"
              >
                {/* Position badge */}
                <div className="w-16 h-16 rounded-md bg-surface-container-high flex items-center justify-center flex-shrink-0 shadow-inner group-hover:bg-primary group-hover:text-on-primary transition-all">
                  <span className="font-display-lg text-2xl font-bold tracking-tighter">#{String(idx + 1).padStart(2, '0')}</span>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-6">
                    <p className="font-display-lg text-2xl text-on-surface tracking-tighter lowercase leading-tight">Token <span className="text-primary">{token.id.slice(0, 8)}</span></p>
                    <StatusBadge status={token.status} />
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40">
                    <span>Entry: {createdAt}</span>
                    {assignedBarber && (
                      <>
                        <span className="w-1 h-1 bg-on-surface-variant rounded-full opacity-20"></span>
                        <span>Artisan: {assignedBarber.name?.toLowerCase() ?? 'unassigned'}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 flex-shrink-0 w-full md:w-auto">
                  {token.status === 'waiting' && (
                    <div className="relative w-full md:w-auto">
                      <button
                        onClick={() => setAssignTarget({ tokenId: token.id, show: true })}
                        disabled={isActing}
                        className="w-full md:w-auto px-10 py-4 rounded-sm bg-primary text-on-primary font-label-md uppercase tracking-[0.2em] text-[11px] shadow-technical hover:opacity-90 transition-all disabled:opacity-50 active:scale-95"
                      >
                        Assign
                      </button>
                      {/* Barber picker dropdown */}
                      {assignTarget?.tokenId === token.id && assignTarget.show && (
                        <div className="absolute right-0 top-full mt-2 z-50 bg-surface-container-high rounded-md shadow-technical border border-white/10 min-w-[200px] overflow-hidden">
                          {barbers.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => handleAssign(token.id, b.id)}
                              className="w-full text-left px-6 py-4 hover:bg-primary hover:text-on-primary transition-all font-label-md uppercase tracking-[0.2em] text-[10px] text-on-surface-variant border-b border-white/5 last:border-0"
                            >
                              {b.name?.toLowerCase() ?? 'artisan'}
                            </button>
                          ))}
                          <button
                            onClick={() => setAssignTarget(null)}
                            className="w-full text-left px-6 py-4 bg-surface-container-low hover:bg-surface-container-high transition-all font-label-md uppercase tracking-[0.2em] text-[10px] text-error opacity-60"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {token.status === 'assigned' && (
                    <button
                      onClick={() => handleComplete(token.id)}
                      disabled={isActing}
                      className="w-full md:w-auto px-10 py-4 rounded-sm bg-primary text-on-primary font-label-md uppercase tracking-[0.2em] text-[11px] shadow-technical hover:opacity-90 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                    >
                      {isActing ? (
                        <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                      )}
                      Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
