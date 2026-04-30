'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import type { QueueTokenDto, BarberDto } from '@/types/domain';

type QueueFilter = 'waiting' | 'assigned' | 'completed' | 'cancelled' | 'all';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    waiting: 'bg-yellow-400/10 text-yellow-600 border-yellow-400/30',
    assigned: 'bg-blue-400/10 text-blue-600 border-blue-400/30',
    completed: 'bg-green-400/10 text-green-600 border-green-400/30',
    cancelled: 'bg-error/10 text-error border-error/30',
  };
  return (
    <span className={`px-3 py-1 rounded-full font-label-sm uppercase border ${cfg[status] ?? 'bg-surface-container text-tertiary border-outline-variant'}`}>
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
      <section className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-gutter">
        <div>
          <span className="font-label-md text-primary uppercase tracking-widest mb-2 block">Real-time Dashboard</span>
          <h2 className="font-display-lg text-display-lg text-on-surface">Daily Queue</h2>
          <p className="text-tertiary font-label-md mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-stack-sm">
          <div className="flex items-center gap-2 bg-surface-container-low p-2 px-4 rounded-lg border border-outline-variant/30">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-label-sm text-secondary">Live · auto-refresh 30s</span>
          </div>
          <button
            onClick={fetchQueue}
            className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors"
            title="Refresh now"
          >
            <span className="material-symbols-outlined text-[20px] text-outline">refresh</span>
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Waiting', value: waitingCount, icon: 'hourglass_top', color: 'text-yellow-600' },
          { label: 'In Chair', value: assignedCount, icon: 'content_cut', color: 'text-blue-600' },
          { label: 'Done Today', value: tokens.filter((t) => t.status === 'completed').length, icon: 'check_circle', color: 'text-green-600' },
          { label: 'Total Today', value: tokens.length, icon: 'groups', color: 'text-primary' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-surface-container-lowest rounded-lg p-4 border border-outline-variant/30 shadow-sm">
            <span className={`material-symbols-outlined ${color} text-[24px] block mb-2`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            <p className="font-display-sm text-on-surface text-2xl font-bold">{loading ? '—' : value}</p>
            <p className="font-label-sm text-tertiary uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">{error}</div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6 overflow-x-auto hide-scrollbar">
        {(['all', 'waiting', 'assigned', 'completed', 'cancelled'] as QueueFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-5 py-2 rounded-full font-label-md capitalize transition-colors ${
              filter === f
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'border border-outline-variant text-on-surface-variant hover:border-primary-container'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-surface-container-low animate-pulse" />
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-[64px] text-outline block mb-4">groups</span>
          <p className="font-headline-md text-on-surface mb-2">Queue is empty</p>
          <p className="text-tertiary font-label-md">
            {filter === 'waiting' ? 'No one is waiting right now.' : `No ${filter} entries today.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tokens.map((token, idx) => {
            const assignedBarber = barbers.find((b) => b.id === token.barberId);
            const isActing = actionLoading === token.id;
            const createdAt = new Date(token.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={token.id}
                className="bg-surface-container-lowest rounded-lg p-5 border border-outline-variant/20 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center"
              >
                {/* Position badge */}
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                  <span className="font-headline-md text-on-surface font-bold">#{idx + 1}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-label-md text-on-surface">Token {token.id.slice(0, 8)}…</p>
                    <StatusBadge status={token.status} />
                  </div>
                  <p className="font-label-sm text-tertiary">
                    Joined at {createdAt}
                    {assignedBarber && ` · Assigned to ${assignedBarber.name ?? 'Barber'}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {token.status === 'waiting' && (
                    <div className="relative">
                      <button
                        onClick={() => setAssignTarget({ tokenId: token.id, show: true })}
                        disabled={isActing}
                        className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-label-md hover:brightness-110 transition-all disabled:opacity-50 text-sm"
                      >
                        Assign
                      </button>
                      {/* Barber picker dropdown */}
                      {assignTarget?.tokenId === token.id && assignTarget.show && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-surface-container-highest rounded-lg shadow-xl border border-outline-variant min-w-[160px]">
                          {barbers.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => handleAssign(token.id, b.id)}
                              className="w-full text-left px-4 py-3 hover:bg-surface-container-low transition-colors font-label-md text-on-surface first:rounded-t-lg last:rounded-b-lg"
                            >
                              {b.name ?? 'Artisan'}
                            </button>
                          ))}
                          <button
                            onClick={() => setAssignTarget(null)}
                            className="w-full text-left px-4 py-3 hover:bg-surface-container-low transition-colors font-label-sm text-tertiary"
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
                      className="px-4 py-2 rounded-lg bg-green-500/10 text-green-700 border border-green-500/30 font-label-md hover:bg-green-500/20 transition-all disabled:opacity-50 text-sm flex items-center gap-1"
                    >
                      {isActing ? (
                        <span className="w-4 h-4 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">check</span>
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
