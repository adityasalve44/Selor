'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ClientDto } from '@/types/domain';
import { SkeletonTableRow } from '@/app/components/Skeleton';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to load clients');
      const d = await res.json();
      setClients(d.data ?? []);
    } catch {
      setError('Unable to load clients. Check your admin access.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchClients();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchClients]);

  return (
    <ErrorBoundary>
      <main className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto min-h-screen">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            {error}
            <button onClick={fetchClients} className="ml-auto underline font-label-sm">Retry</button>
          </div>
        )}
        {/* Header Section */}
        <section className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-gutter">
          <div>
            <p className="font-label-md text-label-md text-primary tracking-[0.2em] mb-2">DIRECTORY</p>
            <h2 className="font-display-lg text-display-lg text-on-surface">Client Relations</h2>
          </div>
          <div className="flex gap-4">
            <div className="relative flex-1 md:w-80">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" data-icon="search">search</span>
              <input className="w-full bg-surface-container-lowest border-none rounded-lg py-3 pl-12 pr-4 shadow-md shadow-black/5 focus:ring-2 focus:ring-primary-container transition-all font-body-md text-on-surface" placeholder="Search by name or loyalty ID..." type="text" />
            </div>
            <button className="bg-primary-container text-on-primary-container px-6 py-3 rounded-lg font-label-md text-label-md flex items-center gap-2 hover:opacity-90 transition-all shadow-md">
              <span className="material-symbols-outlined text-[20px]" data-icon="person_add">person_add</span>
              NEW CLIENT
            </button>
          </div>
        </section>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Client List - Bento Card Style */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-md shadow-black/5 overflow-hidden">
            <div className="p-6 border-b border-surface-variant flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">Clientele</h3>
              <button className="text-primary font-label-sm text-label-sm flex items-center gap-1">
                FILTER <span className="material-symbols-outlined text-[16px]" data-icon="filter_list">filter_list</span>
              </button>
            </div>
            <div className="overflow-x-auto no-scrollbar min-h-[300px]">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant">CLIENT</th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant">LAST VISIT</th>
                    <th className="px-6 py-4 font-label-sm text-label-sm text-on-surface-variant">STATUS</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={4} />)
                  ) : clients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-tertiary">
                        No clients found in the directory.
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr key={client.id} className="hover:bg-surface-container-low/50 transition-colors cursor-pointer group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary">
                              <span className="material-symbols-outlined text-[20px]">person</span>
                            </div>
                            <div>
                              <p className="font-label-md text-label-md text-on-surface">{client.name}</p>
                              <p className="font-label-sm text-label-sm text-outline">{client.loyaltyId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-body-md text-on-surface-variant">
                          {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString("en-IN") : "Never"}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${client.loyaltyTier === 'PLATINUM' ? 'bg-primary-container/20 text-primary' :
                              client.loyaltyTier === 'GOLD' ? 'bg-tertiary-container/30 text-tertiary' :
                              client.loyaltyTier === 'SILVER' ? 'bg-surface-variant text-outline' :
                              'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {client.loyaltyTier}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors" data-icon="chevron_right">chevron_right</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Client Details Sidebar - Snippet View */}
          <div className="lg:col-span-5 flex flex-col gap-gutter">
            <div className="bg-surface-container-lowest rounded-xl shadow-md shadow-black/5 p-8 h-full flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-[64px] text-surface-variant mb-4">account_circle</span>
              <p className="font-label-md text-tertiary uppercase tracking-widest">Select a client</p>
              <p className="font-body-md text-on-surface-variant mt-2 max-w-[250px]">
                Click on a client record in the directory to view their complete dossier and visit history.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* FAB (Mobile Only) */}
      <div className="fixed bottom-24 right-6 md:right-12 z-40 md:hidden">
        <button className="h-14 w-14 rounded-full bg-primary-container text-on-primary-container shadow-xl flex items-center justify-center">
          <span className="material-symbols-outlined" data-icon="add">add</span>
        </button>
      </div>
    </ErrorBoundary>
  );
}