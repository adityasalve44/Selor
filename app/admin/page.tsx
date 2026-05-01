'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import type { AnalyticsSeriesDto } from '@/types/domain';

interface AnalyticsState {
  revenue: number;
  revenuePoints: { bucket: string; value: number }[];
  totalBookings: number;
  completedBookings: number;
  queueCompleted: number;
  utilizationMinutes: number;
}

function StatCard({
  icon, label, value, badge, goal, progress,
}: {
  icon: string; label: string; value: string; badge?: string; goal?: string; progress?: number;
}) {
  return (
    <div className="col-span-12 md:col-span-4 bg-surface-container-low rounded-lg p-10 shadow-technical border border-white/5 flex flex-col justify-between group hover:bg-surface-container-high transition-all">
      <div>
        <div className="flex justify-between items-start mb-8">
          <div className="w-12 h-12 rounded-md bg-surface-container-high flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
          {badge && (
            <div className="px-4 py-1 rounded-sm text-[9px] font-label-md uppercase tracking-[0.2em] border border-primary/20 text-primary bg-primary/5">
              {badge}
            </div>
          )}
        </div>
        <h3 className="font-label-md text-on-surface-variant uppercase tracking-[0.2em] text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">{label}</h3>
        <p className="font-display-lg text-display-lg text-on-surface mt-4 tracking-tighter leading-none">{value}</p>
      </div>
      {goal !== undefined && progress !== undefined && (
        <div className="mt-10 pt-8 border-t border-outline-variant/10 flex justify-between items-center">
          <span className="font-label-md text-[9px] text-on-surface-variant uppercase tracking-[0.2em] opacity-40">Goal: {goal}</span>
          <div className="w-32 h-1 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function MiniChart({ points, loading }: { points: { bucket: string; value: number }[]; loading: boolean }) {
  const SKELETON_HEIGHTS = [45, 65, 38, 72, 55, 80, 42, 60, 50];

  if (loading) {
    return (
      <div className="h-48 flex items-end justify-between gap-3">
        {SKELETON_HEIGHTS.map((h, i) => (
          <div key={i} className="w-full bg-surface-container-high/40 rounded-sm animate-pulse" style={{ height: `${h}%` }} />
        ))}
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-on-surface-variant/20 font-label-md uppercase tracking-[0.2em] text-[10px]">
        null set: data unavailable
      </div>
    );
  }

  const max = Math.max(...points.map((p) => p.value), 1);
  const displayed = points.slice(-12);

  return (
    <div className="h-48 flex items-end justify-between gap-3">
      {displayed.map((p, i) => {
        const pct = Math.max((p.value / max) * 100, 4);
        const isLatest = i === displayed.length - 1;
        return (
          <div
            key={p.bucket}
            className={`w-full rounded-sm transition-all duration-700 ${isLatest ? 'bg-primary shadow-technical' : 'bg-surface-container-high/40 hover:bg-primary/20'}`}
            style={{ height: `${pct}%` }}
            title={`${p.bucket}: ₹${p.value.toFixed(0)}`}
          />
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'today' | '7d' | '30d'>('7d');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = range === 'today'
        ? format(new Date(), 'yyyy-MM-dd')
        : format(subDays(new Date(), range === '7d' ? 7 : 30), 'yyyy-MM-dd');
      const to = format(new Date(), 'yyyy-MM-dd');
      const res = await fetch(`/api/analytics/overview?from=${from}&to=${to}`);
      if (!res.ok) throw new Error('Failed to load analytics');
      const data = await res.json();
      const series: AnalyticsSeriesDto[] = data.series ?? [];

      const get = (key: string) => series.find((s) => s.key === key);
      const sum = (key: string) =>
        (get(key)?.points ?? []).reduce((acc, p) => acc + p.value, 0);

      setAnalytics({
        revenue: sum('revenue'),
        revenuePoints: get('revenue')?.points ?? [],
        totalBookings: sum('bookings'),
        completedBookings: sum('completed'),
        queueCompleted: sum('queue_completed'),
        utilizationMinutes: sum('barber_utilization'),
      });
    } catch {
      setError('Unable to load analytics. You may need admin access.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchAnalytics();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchAnalytics]);

  const revenueGoal = range === 'today' ? 4000 : range === '7d' ? 28000 : 120000;

  return (
    <main className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto min-h-screen pb-24">
      {/* Header */}
      <section className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-10 mt-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
             <span className="font-label-md text-on-surface-variant uppercase tracking-[0.3em] text-[10px] opacity-40">Intelligence Matrix</span>
          </div>
          <h2 className="font-display-lg text-display-lg text-on-surface tracking-tighter lowercase">operational <span className="text-primary">metrics</span></h2>
          <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40">system wide performance audit</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-low p-2 rounded-md shadow-technical border border-white/5">
          {(['today', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-8 py-3 rounded-sm font-label-md uppercase tracking-[0.2em] text-[10px] transition-all ${
                range === r
                  ? 'bg-primary text-on-primary shadow-technical'
                  : 'text-on-surface-variant opacity-40 hover:opacity-100'
              }`}
            >
              {r === 'today' ? '24h' : r === '7d' ? '7d' : '30d'}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          {error}
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Revenue Card */}
        <StatCard
          icon="payments"
          label={`${range === 'today' ? "Today's" : range === '7d' ? "7-Day" : "30-Day"} Revenue`}
          value={loading ? '—' : `₹${(analytics?.revenue ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          badge={loading ? undefined : analytics && analytics.revenue > 0 ? 'Live' : undefined}
          goal={`₹${revenueGoal.toLocaleString('en-IN')}`}
          progress={analytics ? analytics.revenue / revenueGoal : 0}
        />

        {/* Bookings Card */}
        <StatCard
          icon="calendar_today"
          label="Total Bookings"
          value={loading ? '—' : String(analytics?.totalBookings ?? 0)}
          badge={loading ? undefined : analytics ? `${analytics.completedBookings} done` : undefined}
        />

        {/* Queue Card */}
        <StatCard
          icon="groups"
          label="Queue Served"
          value={loading ? '—' : String(analytics?.queueCompleted ?? 0)}
          badge={loading ? undefined : analytics ? `${analytics.utilizationMinutes}m utilization` : undefined}
        />

        {/* Revenue Trend Chart */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-low rounded-lg p-10 shadow-technical border border-white/5">
          <div className="flex justify-between items-center mb-10">
            <div className="space-y-1">
              <h3 className="font-display-lg text-2xl text-on-surface lowercase tracking-tighter">financial trajectory</h3>
              <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40">revenue distribution (₹)</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[9px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40">Live Flux</span>
            </div>
          </div>
          <MiniChart points={analytics?.revenuePoints ?? []} loading={loading} />
          <div className="flex justify-between mt-8 text-[9px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-20">
            <span>T-0 horizon</span>
            <span>Current epoch</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-low rounded-lg p-10 shadow-technical border border-white/5 flex flex-col">
          <h3 className="font-display-lg text-2xl text-on-surface lowercase tracking-tighter mb-10">system modules</h3>
          <div className="space-y-4 flex-1">
            {[
              { href: '/admin/queue', icon: 'terminal', label: 'protocol queue' },
              { href: '/admin/bookings', icon: 'calendar_today', label: 'manifest registry' },
              { href: '/admin/staff', icon: 'badge', label: 'artisan matrix' },
              { href: '/admin/clients', icon: 'database', label: 'dossier index' },
            ].map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-5 p-5 rounded-md bg-surface-container-high/30 hover:bg-surface-container-high transition-all group border border-transparent hover:border-white/5"
              >
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shadow-inner group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                </div>
                <span className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-[0.1em] group-hover:text-on-surface transition-colors">{label}</span>
                <span className="ml-auto material-symbols-outlined text-[16px] text-on-surface-variant opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all">arrow_forward</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Booking Status Breakdown */}
        {!loading && analytics && (
          <div className="col-span-12 bg-surface-container-low rounded-lg p-10 shadow-technical border border-white/5">
            <div className="flex items-center justify-between mb-12">
               <h3 className="font-display-lg text-2xl text-on-surface lowercase tracking-tighter">registry overview</h3>
               <div className="w-20 h-1 bg-primary/20 rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {[
                { label: 'Aggregate', value: analytics.totalBookings, color: 'bg-primary' },
                { label: 'Verified', value: analytics.completedBookings, color: 'bg-primary/60' },
                { label: 'Operational', value: analytics.queueCompleted, color: 'bg-primary/40' },
                {
                  label: 'Efficiency',
                  value: analytics.totalBookings > 0
                    ? `${Math.round((analytics.completedBookings / analytics.totalBookings) * 100)}%`
                    : '—',
                  color: 'bg-primary/20',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                     <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                     <p className="font-label-md text-on-surface-variant uppercase tracking-[0.2em] text-[9px] opacity-40">{label}</p>
                  </div>
                  <p className="font-display-lg text-4xl text-on-surface tracking-tighter">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
