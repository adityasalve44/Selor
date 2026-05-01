'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ShopSettingsDto } from '@/types/domain';
import { SkeletonSettingsSection } from '@/app/components/Skeleton';
import { useToast } from '@/app/components/Toast';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

// ─── Types ────────────────────────────────────────────────────────────────────

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
interface DayHours { enabled: boolean; start: string; end: string; }
type WeeklyHours = Record<DayKey, DayHours>;

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const DEFAULT_WEEKLY_HOURS: WeeklyHours = {
  mon: { enabled: true, start: '09:00', end: '19:00' },
  tue: { enabled: true, start: '09:00', end: '19:00' },
  wed: { enabled: true, start: '09:00', end: '19:00' },
  thu: { enabled: true, start: '09:00', end: '19:00' },
  fri: { enabled: true, start: '09:00', end: '20:00' },
  sat: { enabled: true, start: '09:00', end: '20:00' },
  sun: { enabled: false, start: '10:00', end: '17:00' },
};

function safeWeeklyHours(raw: unknown): WeeklyHours {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as WeeklyHours;
  }
  return DEFAULT_WEEKLY_HOURS;
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-low rounded-lg shadow-technical overflow-hidden border border-white/5">
      <div className="flex items-center gap-5 px-10 py-8 border-b border-outline-variant/10 bg-surface-container-high/20">
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
           <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <h3 className="font-display-lg text-2xl text-on-surface lowercase tracking-tighter">{title}</h3>
      </div>
      <div className="p-10">{children}</div>
    </section>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="font-label-md text-on-surface-variant uppercase tracking-[0.2em] text-[10px] opacity-40 block mb-3">{children}</span>;
}

function TextInput({
  id, value, onChange, placeholder, type = 'text',
}: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-5 py-4 rounded-md bg-surface-container-high border-none
        text-on-surface font-display-lg text-lg focus:ring-1 focus:ring-primary
        transition-all placeholder:text-on-surface-variant/20 placeholder:lowercase"
    />
  );
}

function NumberInput({
  id, value, onChange, min, max, step = 1, unit,
}: { id: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  return (
    <div className="flex items-center gap-4">
      <input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28 px-5 py-4 rounded-md bg-surface-container-high border-none
          text-on-surface font-display-lg text-lg focus:ring-1 focus:ring-primary transition-all"
      />
      {unit && <span className="font-label-md text-on-surface-variant text-[11px] uppercase tracking-widest opacity-60">{unit}</span>}
    </div>
  );
}

// ─── Reminder Chips ───────────────────────────────────────────────────────────

function ReminderChips({ values, onChange }: { values: number[]; onChange: (v: number[]) => void }) {
  const [draft, setDraft] = useState('');
  const PRESETS = [30, 60, 1440, 2880];

  function add(val: number) {
    if (!values.includes(val)) onChange([...values, val].sort((a, b) => a - b));
  }
  function remove(val: number) {
    onChange(values.filter((v) => v !== val));
  }
  function addDraft() {
    const n = Number(draft);
    if (n >= 5 && n <= 10080 && !values.includes(n)) {
      add(n);
      setDraft('');
    }
  }

  function formatMinutes(m: number) {
    if (m >= 1440) return `${m / 1440}d`;
    if (m >= 60) return `${m / 60}h`;
    return `${m}m`;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full font-label-sm">
            {formatMinutes(v)}
            <button onClick={() => remove(v)} className="hover:text-error transition-colors ml-1">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </span>
        ))}
        {values.length === 0 && (
          <span className="font-body-sm text-tertiary italic">No reminders configured</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <p className="w-full font-label-sm text-tertiary">Quick add:</p>
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => add(p)}
            disabled={values.includes(p)}
            className="px-3 py-1 border border-outline-variant text-on-surface-variant rounded-full text-xs
              hover:bg-surface-container transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            +{formatMinutes(p)}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={draft}
          min={5}
          max={10080}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addDraft()}
          placeholder="Custom (minutes)"
          className="w-44 px-3 py-2 rounded-lg bg-surface-container border border-outline-variant
            text-on-surface font-body-sm focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
        />
        <button
          onClick={addDraft}
          className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-lg
            hover:bg-surface-container transition-colors font-label-sm"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Business Hours Editor ────────────────────────────────────────────────────

function BusinessHoursEditor({ hours, onChange }: { hours: WeeklyHours; onChange: (h: WeeklyHours) => void }) {
  function setDay(key: DayKey, patch: Partial<DayHours>) {
    onChange({ ...hours, [key]: { ...hours[key], ...patch } });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {DAY_LABELS.map(({ key, label }) => {
        const day = hours[key] ?? { enabled: false, start: '09:00', end: '18:00' };
        return (
          <div key={key} className={`flex items-center justify-between gap-5 p-6 rounded-md transition-all duration-500
            ${day.enabled ? 'bg-surface-container-high shadow-technical border border-white/5' : 'bg-surface-container-high/20 opacity-30'}`}>
            <div className="flex items-center gap-5">
              <button
                id={`hours-toggle-${key}`}
                onClick={() => setDay(key, { enabled: !day.enabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${day.enabled ? 'bg-primary' : 'bg-surface-container-highest'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-technical transition-transform ${day.enabled ? 'left-6' : 'left-0.5'}`} />
              </button>
              <span className="font-display-lg text-lg text-on-surface lowercase w-12">{label.slice(0, 3)}</span>
            </div>
            {day.enabled ? (
              <div className="flex items-center gap-4">
                <input
                  id={`hours-start-${key}`}
                  type="time"
                  value={day.start || ''}
                  onChange={(e) => setDay(key, { start: e.target.value })}
                  className="px-4 py-2 rounded-md bg-surface-container-low border-none
                    text-on-surface font-display-lg text-lg focus:ring-1 focus:ring-primary transition-all"
                />
                <span className="text-[9px] font-label-md uppercase tracking-[0.2em] opacity-30">to</span>
                <input
                  id={`hours-end-${key}`}
                  type="time"
                  value={day.end || ''}
                  onChange={(e) => setDay(key, { end: e.target.value })}
                  className="px-4 py-2 rounded-md bg-surface-container-low border-none
                    text-on-surface font-display-lg text-lg focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            ) : (
              <span className="text-[10px] font-label-md uppercase tracking-[0.3em] opacity-40">Inactive</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [shopName, setShopName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [slotInterval, setSlotInterval] = useState(30);
  const [bufferBefore, setBufferBefore] = useState(5);
  const [bufferAfter, setBufferAfter] = useState(10);
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState<number[]>([60, 1440]);
  const [inviteBaseUrl, setInviteBaseUrl] = useState('');
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>(DEFAULT_WEEKLY_HOURS);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const d = await res.json();
      const s: ShopSettingsDto = d.settings;
      setShopName(s.shopName ?? '');
      setTimezone(s.timezone ?? 'Asia/Kolkata');
      setSlotInterval(s.slotIntervalMinutes ?? 30);
      setBufferBefore(s.defaultBufferBeforeMinutes ?? 5);
      setBufferAfter(s.defaultBufferAfterMinutes ?? 10);
      setReminderLeadMinutes(Array.isArray(s.reminderLeadMinutes) ? s.reminderLeadMinutes : [60, 1440]);
      setInviteBaseUrl(s.inviteBaseUrl ?? '');
      setWeeklyHours(safeWeeklyHours(s.weeklyHours));
    } catch {
      setError('Unable to load settings. You may need admin access.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSettings();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchSettings]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: shopName.trim() || undefined,
          timezone: timezone.trim() || undefined,
          slotIntervalMinutes: slotInterval,
          defaultBufferBeforeMinutes: bufferBefore,
          defaultBufferAfterMinutes: bufferAfter,
          reminderLeadMinutes,
          inviteBaseUrl: inviteBaseUrl.trim() || undefined,
          weeklyHours,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? 'Failed to save settings');
      }
      toast.success('Settings saved successfully.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ErrorBoundary>
      <main className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto min-h-screen pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-10 mt-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span className="font-label-md text-on-surface-variant uppercase tracking-[0.3em] text-[10px] opacity-40">System Core</span>
            </div>
            <h2 className="font-display-lg text-display-lg text-on-surface tracking-tighter lowercase">studio <span className="text-primary">configuration</span></h2>
          </div>
          <button
            id="save-settings-btn"
            disabled={saving || loading}
            onClick={handleSave}
            className="flex items-center gap-4 px-10 py-5 bg-primary text-on-primary
              font-label-md rounded-md shadow-technical hover:opacity-90 transition-all uppercase tracking-[0.2em] text-[11px]
              disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-[20px]">save</span>}
            Commit Changes
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            {error}
            <button onClick={fetchSettings} className="ml-auto underline font-label-sm">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonSettingsSection key={i} />)}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Shop Identity */}
            <Section title="Shop Identity" icon="storefront">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FieldLabel>Shop Name</FieldLabel>
                  <TextInput id="settings-shop-name" value={shopName} onChange={setShopName} placeholder="My Barbershop" />
                </div>
                <div>
                  <FieldLabel>Timezone</FieldLabel>
                  <TextInput id="settings-timezone" value={timezone} onChange={setTimezone} placeholder="Asia/Kolkata" />
                  <p className="font-label-sm text-tertiary mt-1">e.g. Asia/Kolkata, America/New_York</p>
                </div>
              </div>
            </Section>

            {/* Booking Rules */}
            <Section title="Booking Rules" icon="tune">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <FieldLabel>Slot Interval</FieldLabel>
                  <NumberInput id="settings-slot-interval" value={slotInterval} onChange={setSlotInterval} min={5} max={120} step={5} unit="min" />
                  <p className="font-label-sm text-tertiary mt-1">Time grid resolution</p>
                </div>
                <div>
                  <FieldLabel>Buffer Before</FieldLabel>
                  <NumberInput id="settings-buffer-before" value={bufferBefore} onChange={setBufferBefore} min={0} max={60} step={5} unit="min" />
                  <p className="font-label-sm text-tertiary mt-1">Prep time before appointment</p>
                </div>
                <div>
                  <FieldLabel>Buffer After</FieldLabel>
                  <NumberInput id="settings-buffer-after" value={bufferAfter} onChange={setBufferAfter} min={0} max={60} step={5} unit="min" />
                  <p className="font-label-sm text-tertiary mt-1">Cleanup time after appointment</p>
                </div>
              </div>
            </Section>

            {/* Business Hours */}
            <Section title="Business Hours" icon="schedule">
              <BusinessHoursEditor hours={weeklyHours} onChange={setWeeklyHours} />
            </Section>

            {/* Reminders */}
            <Section title="Appointment Reminders" icon="notifications">
              <FieldLabel>Send reminders before appointment</FieldLabel>
              <ReminderChips values={reminderLeadMinutes} onChange={setReminderLeadMinutes} />
            </Section>

            {/* Invite URL */}
            <Section title="Invite Configuration" icon="link">
              <div>
                <FieldLabel>Staff Invite Base URL</FieldLabel>
                <TextInput
                  id="settings-invite-url"
                  value={inviteBaseUrl}
                  onChange={setInviteBaseUrl}
                  placeholder="https://yourdomain.com/join"
                  type="url"
                />
                <p className="font-label-sm text-tertiary mt-1">
                  Invite links will be appended with <code className="text-primary">?invite=TOKEN</code>
                </p>
              </div>
            </Section>
          </div>
        )}
      </main>
    </ErrorBoundary>
  );
}
