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
    <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-lg p-stack-lg shadow-md shadow-black/5 flex flex-col justify-between border border-surface-container">
      <div>
        <div className="flex justify-between items-start mb-stack-md">
          <span className="p-3 bg-surface-container-low rounded-xl text-primary-container material-symbols-outlined">{icon}</span>
          {badge && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-label-sm">{badge}</span>
          )}
        </div>
        <h3 className="font-label-md text-tertiary uppercase tracking-widest">{label}</h3>
        <p className="font-display-lg text-on-surface mt-2">{value}</p>
      </div>
      {goal !== undefined && progress !== undefined && (
        <div className="mt-stack-md pt-stack-md border-t border-surface-container-low flex justify-between items-center">
          <span className="font-label-sm text-tertiary">Goal: {goal}</span>
          <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary-container transition-all" style={{ width: `${Math.min(progress * 100, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function MiniChart({ points, loading }: { points: { bucket: string; value: number }[]; loading: boolean }) {
  // Deterministic heights so SSR and client render identically (no hydration mismatch)
  const SKELETON_HEIGHTS = [45, 65, 38, 72, 55, 80, 42, 60, 50];

  if (loading) {
    return (
      <div className="h-48 flex items-end justify-between gap-2">
        {SKELETON_HEIGHTS.map((h, i) => (
          <div key={i} className="w-full bg-surface-container-low rounded-t-lg animate-pulse" style={{ height: `${h}%` }} />
        ))}
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-tertiary font-label-md">
        No data available yet
      </div>
    );
  }

  const max = Math.max(...points.map((p) => p.value), 1);
  const displayed = points.slice(-12);

  return (
    <div className="h-48 flex items-end justify-between gap-2">
      {displayed.map((p, i) => {
        const pct = Math.max((p.value / max) * 100, 4);
        const isLatest = i === displayed.length - 1;
        return (
          <div
            key={p.bucket}
            className={`w-full rounded-t-lg transition-all ${isLatest ? 'bg-primary-container' : 'bg-surface-container-low hover:bg-primary-container/40'}`}
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
      <section className="mb-stack-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-label-md text-primary tracking-widest uppercase mb-2 block">Performance Hub</span>
            <h2 className="font-headline-lg text-on-surface">Analytics Overview</h2>
          </div>
          <div className="flex gap-2">
            {(['today', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-lg font-label-md transition-colors ${
                  range === r
                    ? 'bg-primary-container text-on-primary shadow-lg shadow-primary-container/20'
                    : 'border border-outline-variant text-on-surface bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
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
        <div className="col-span-12 md:col-span-8 bg-surface-container-lowest rounded-lg p-stack-lg shadow-md shadow-black/5 border border-surface-container">
          <div className="flex justify-between items-center mb-stack-lg">
            <h3 className="font-headline-md text-on-surface">Revenue Trend</h3>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-container" />
              <span className="font-label-sm text-tertiary">Revenue (₹)</span>
            </div>
          </div>
          <MiniChart points={analytics?.revenuePoints ?? []} loading={loading} />
          <div className="flex justify-between mt-4 px-2">
            <span className="font-label-sm text-tertiary">Earlier</span>
            <span className="font-label-sm text-tertiary">Recent</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-lg p-stack-lg shadow-md shadow-black/5 border border-surface-container">
          <h3 className="font-headline-md text-on-surface mb-stack-lg">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { href: '/admin/queue', icon: 'groups', label: 'Manage Queue' },
              { href: '/admin/bookings', icon: 'calendar_today', label: 'All Bookings' },
              { href: '/admin/staff', icon: 'person', label: 'Staff Management' },
              { href: '/admin/clients', icon: 'people', label: 'Client List' },
            ].map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors group"
              >
                <span className="material-symbols-outlined text-primary-container group-hover:text-primary transition-colors">{icon}</span>
                <span className="font-label-md text-on-surface">{label}</span>
                <span className="ml-auto material-symbols-outlined text-[16px] text-outline group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Booking Status Breakdown */}
        {!loading && analytics && (
          <div className="col-span-12 bg-surface-container-lowest rounded-lg p-stack-lg shadow-md shadow-black/5 border border-surface-container">
            <h3 className="font-headline-md text-on-surface mb-stack-lg">Booking Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Total', value: analytics.totalBookings, color: 'bg-primary-container' },
                { label: 'Completed', value: analytics.completedBookings, color: 'bg-green-500' },
                { label: 'Queue Served', value: analytics.queueCompleted, color: 'bg-blue-400' },
                {
                  label: 'Completion Rate',
                  value: analytics.totalBookings > 0
                    ? `${Math.round((analytics.completedBookings / analytics.totalBookings) * 100)}%`
                    : '—',
                  color: 'bg-primary',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col items-center p-4 rounded-xl bg-surface-container-low">
                  <div className={`w-3 h-3 rounded-full ${color} mb-2`} />
                  <p className="font-display-sm text-on-surface text-2xl font-bold">{value}</p>
                  <p className="font-label-sm text-tertiary uppercase tracking-wider mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
