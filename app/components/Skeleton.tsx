'use client';

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface-container-high rounded-md ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-container-low rounded-lg p-10 shadow-technical animate-pulse flex flex-col gap-8 border border-white/5">
      <div className="flex justify-between items-start">
        <div className="w-24 h-24 rounded-md bg-surface-container-high shadow-inner" />
        <div className="flex flex-col items-end gap-3">
          <div className="w-20 h-2 rounded-full bg-surface-container-high opacity-40" />
          <div className="w-14 h-2 rounded-full bg-surface-container-high opacity-20" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="w-3/4 h-6 rounded-md bg-surface-container-high" />
        <div className="w-1/2 h-4 rounded-md bg-surface-container-high opacity-40" />
      </div>
      <div className="pt-8 border-t border-outline-variant/10 flex gap-4">
        <div className="flex-1 h-12 rounded-md bg-surface-container-high" />
        <div className="w-12 h-12 rounded-md bg-surface-container-high" />
      </div>
    </div>
  );
}

export function SkeletonServiceCard() {
  return (
    <div className="bg-surface-container-low rounded-lg p-8 border border-white/5 animate-pulse flex flex-col gap-6 shadow-technical">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-md bg-surface-container-high shadow-inner" />
        <div className="w-20 h-6 rounded-sm bg-surface-container-high opacity-40" />
      </div>
      <div className="space-y-4">
        <div className="w-3/4 h-8 rounded-sm bg-surface-container-high" />
        <div className="w-1/2 h-5 rounded-sm bg-surface-container-high opacity-20" />
      </div>
      <div className="flex gap-3 mt-auto pt-6 border-t border-outline-variant/10">
        <div className="flex-1 h-10 rounded-sm bg-surface-container-high" />
        <div className="w-12 h-10 rounded-sm bg-surface-container-high" />
        <div className="w-12 h-10 rounded-sm bg-surface-container-high" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-10 py-8">
          <div
            className="h-4 rounded-md bg-surface-container-high/60"
            style={{ width: i === 0 ? '60%' : i === cols - 1 ? '30%' : '50%' }}
          />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="col-span-12 md:col-span-4 bg-surface-container-low rounded-lg p-10 shadow-technical animate-pulse flex flex-col gap-6 border border-white/5">
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 rounded-md bg-surface-container-high" />
        <div className="w-12 h-4 rounded-full bg-surface-container-high opacity-40" />
      </div>
      <div className="w-1/2 h-2 rounded-full bg-surface-container-high opacity-20" />
      <div className="w-3/4 h-10 rounded-md bg-surface-container-high" />
    </div>
  );
}

export function SkeletonSettingsSection() {
  return (
    <div className="bg-surface-container-low rounded-lg p-10 shadow-technical animate-pulse space-y-8 border border-white/5">
      <div className="w-1/3 h-6 rounded-md bg-surface-container-high" />
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <div className="w-1/4 h-2 rounded-full bg-surface-container-high opacity-40" />
            <div className="w-full h-14 rounded-md bg-surface-container-high" />
          </div>
        ))}
      </div>
    </div>
  );
}
