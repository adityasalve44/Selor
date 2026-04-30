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
    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-md shadow-black/5 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-variant/30 bg-surface-container/40">
        <span className="material-symbols-outlined text-primary-container text-[20px]">{icon}</span>
        <h3 className="font-headline-sm text-on-surface">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="font-label-sm text-tertiary uppercase tracking-wider block mb-1.5">{children}</span>;
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
      className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline-variant
        text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container
        transition-all placeholder:text-outline"
    />
  );
}

function NumberInput({
  id, value, onChange, min, max, step = 1, unit,
}: { id: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28 px-4 py-3 rounded-lg bg-surface-container border border-outline-variant
          text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container transition-all"
      />
      {unit && <span className="font-label-sm text-tertiary">{unit}</span>}
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
    <div className="space-y-2">
      {DAY_LABELS.map(({ key, label }) => {
        const day = hours[key] ?? { enabled: false, start: '09:00', end: '18:00' };
        return (
          <div key={key} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg transition-colors
            ${day.enabled ? 'bg-surface-container' : 'bg-surface-container/40 opacity-60'}`}>
            <div className="flex items-center gap-3 w-32 shrink-0">
              <button
                id={`hours-toggle-${key}`}
                onClick={() => setDay(key, { enabled: !day.enabled })}
                className={`relative w-10 h-5 rounded-full transition-colors ${day.enabled ? 'bg-primary-container' : 'bg-surface-container-high'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${day.enabled ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className="font-label-md text-on-surface text-sm w-16">{label.slice(0, 3)}</span>
            </div>
            {day.enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  id={`hours-start-${key}`}
                  type="time"
                  value={day.start || ''}
                  onChange={(e) => setDay(key, { start: e.target.value })}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant
                    text-on-surface font-body-sm focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
                />
                <span className="text-tertiary font-label-sm">to</span>
                <input
                  id={`hours-end-${key}`}
                  type="time"
                  value={day.end || ''}
                  onChange={(e) => setDay(key, { end: e.target.value })}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant
                    text-on-surface font-body-sm focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
                />
              </div>
            ) : (
              <span className="font-label-sm text-tertiary italic">Closed</span>
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
      <main className="px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto min-h-screen pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-stack-lg gap-4">
          <div className="space-y-1">
            <span className="font-label-md text-primary tracking-widest uppercase block">Admin</span>
            <h2 className="font-headline-lg text-on-surface">Shop Settings</h2>
          </div>
          <button
            id="save-settings-btn"
            disabled={saving || loading}
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container
              font-label-md rounded-lg shadow-md hover:brightness-110 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-[18px]">save</span>}
            Save Settings
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
