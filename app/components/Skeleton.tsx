'use client';

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface-container-low rounded ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-stack-lg border border-outline-variant/30 animate-pulse flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="w-24 h-24 rounded-lg bg-surface-container-low" />
        <div className="flex flex-col items-end gap-2">
          <div className="w-20 h-4 rounded-full bg-surface-container-low" />
          <div className="w-14 h-3 rounded-full bg-surface-container-low" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-3/4 h-5 rounded-full bg-surface-container-low" />
        <div className="w-1/2 h-4 rounded-full bg-surface-container-low" />
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="w-20 h-6 rounded-full bg-surface-container-low" />
        <div className="w-24 h-6 rounded-full bg-surface-container-low" />
      </div>
      <div className="pt-4 border-t border-outline-variant/30 flex gap-3">
        <div className="flex-1 h-9 rounded-lg bg-surface-container-low" />
        <div className="w-10 h-9 rounded-lg bg-surface-container-low" />
      </div>
    </div>
  );
}

export function SkeletonServiceCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 animate-pulse flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-surface-container-low" />
        <div className="w-16 h-6 rounded-full bg-surface-container-low" />
      </div>
      <div className="space-y-2">
        <div className="w-2/3 h-5 rounded-full bg-surface-container-low" />
        <div className="w-1/2 h-4 rounded-full bg-surface-container-low" />
      </div>
      <div className="flex gap-2 mt-auto pt-4 border-t border-outline-variant/30">
        <div className="flex-1 h-9 rounded-lg bg-surface-container-low" />
        <div className="w-10 h-9 rounded-lg bg-surface-container-low" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="animate-pulse border-b border-surface-variant">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div
            className="h-4 rounded-full bg-surface-container-low"
            style={{ width: i === 0 ? '60%' : i === cols - 1 ? '30%' : '50%' }}
          />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-lg p-stack-lg border border-surface-container animate-pulse flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 rounded-xl bg-surface-container-low" />
        <div className="w-12 h-6 rounded-full bg-surface-container-low" />
      </div>
      <div className="w-1/2 h-3 rounded-full bg-surface-container-low" />
      <div className="w-3/4 h-8 rounded-full bg-surface-container-low" />
    </div>
  );
}

export function SkeletonSettingsSection() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/30 animate-pulse space-y-4">
      <div className="w-1/3 h-5 rounded-full bg-surface-container-low" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="w-1/4 h-3 rounded-full bg-surface-container-low" />
            <div className="w-full h-10 rounded-lg bg-surface-container-low" />
          </div>
        ))}
      </div>
    </div>
  );
}
