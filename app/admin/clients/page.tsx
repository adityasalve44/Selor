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
      <main className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto min-h-screen">
        {error && (
          <div className="mb-8 p-6 rounded-lg bg-error/5 border border-error/10 text-error text-[11px] font-label-md uppercase tracking-widest flex items-center gap-4">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            {error}
            <button onClick={fetchClients} className="ml-auto underline">Retry Connection</button>
          </div>
        )}
        {/* Header Section */}
        <section className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-10 mt-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
              <span className="font-label-md text-on-surface-variant uppercase tracking-[0.3em] text-[10px] opacity-40">Client Relations</span>
            </div>
            <h2 className="font-display-lg text-display-lg text-on-surface tracking-tighter lowercase">studio <span className="text-primary">dossier</span></h2>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 md:w-96 group">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40 transition-opacity group-focus-within:opacity-100" data-icon="search">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-md py-5 pl-16 pr-6 shadow-technical focus:ring-1 focus:ring-primary transition-all font-display-lg text-xl text-on-surface placeholder:text-on-surface-variant/20 placeholder:lowercase" placeholder="search records..." type="text" />
            </div>
            <button className="bg-primary text-on-primary px-10 py-5 rounded-md font-label-md uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-4 hover:opacity-90 transition-all shadow-technical active:scale-95">
              <span className="material-symbols-outlined text-[20px]" data-icon="person_add">person_add</span>
              recruit client
            </button>
          </div>
        </section>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Client List */}
          <div className="lg:col-span-8 bg-surface-container-low rounded-lg shadow-technical overflow-hidden border border-white/5">
            <div className="p-10 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                 <h3 className="font-display-lg text-2xl text-on-surface tracking-tighter lowercase">clientele manifest</h3>
              </div>
              <button className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-all flex items-center gap-3">
                Parameters <span className="material-symbols-outlined text-[18px]">tune</span>
              </button>
            </div>
            <div className="overflow-x-auto no-scrollbar min-h-[400px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-high/30">
                    <th className="px-10 py-8 font-label-md text-[9px] uppercase tracking-[0.3em] text-on-surface-variant opacity-40 font-bold">Protocol</th>
                    <th className="px-10 py-8 font-label-md text-[9px] uppercase tracking-[0.3em] text-on-surface-variant opacity-40 font-bold">Temporal Log</th>
                    <th className="px-10 py-8 font-label-md text-[9px] uppercase tracking-[0.3em] text-on-surface-variant opacity-40 font-bold">Classification</th>
                    <th className="px-10 py-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={4} />)
                  ) : clients.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-10 py-24 text-center font-display-lg text-on-surface-variant opacity-40 lowercase text-2xl tracking-tighter">
                        Zero records integrated into directory.
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr key={client.id} className="hover:bg-surface-container-high/50 transition-all cursor-pointer group">
                        <td className="px-10 py-10">
                          <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-sm bg-surface-container-high flex items-center justify-center text-primary/30 group-hover:bg-primary group-hover:text-on-primary transition-all shadow-inner border border-white/5">
                              <span className="material-symbols-outlined text-[20px]">fingerprint</span>
                            </div>
                            <div className="space-y-1">
                              <p className="font-display-lg text-2xl text-on-surface tracking-tighter lowercase leading-tight group-hover:text-primary transition-colors">{client.name}</p>
                              <p className="text-[9px] font-label-md text-on-surface-variant uppercase tracking-[0.2em] opacity-40">{client.loyaltyId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-10">
                           <p className="font-display-lg text-xl text-on-surface-variant opacity-60 tracking-tighter lowercase">
                             {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' }).toLowerCase() : "none"}
                           </p>
                        </td>
                        <td className="px-10 py-10">
                          <span className={`inline-flex items-center px-5 py-2 rounded-sm text-[9px] font-bold uppercase tracking-[0.2em] shadow-technical
                            ${client.loyaltyTier === 'PLATINUM' ? 'bg-primary text-on-primary' :
                              client.loyaltyTier === 'GOLD' ? 'bg-surface-container-highest text-on-surface shadow-inner' :
                              'bg-surface-container-high text-on-surface-variant/40 shadow-inner'
                            }`}
                          >
                            {client.loyaltyTier}
                          </span>
                        </td>
                        <td className="px-10 py-10 text-right">
                          <span className="material-symbols-outlined text-on-surface-variant opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-2 text-[20px]">arrow_forward</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-12">
            <div className="bg-surface-container-low rounded-lg shadow-technical p-12 h-fit flex flex-col items-center justify-center text-center border border-white/5 relative overflow-hidden group">
               <div className="absolute inset-0 technical-grid opacity-5 group-hover:opacity-10 transition-opacity duration-700"></div>
              <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center text-primary/10 mb-8 shadow-inner border border-outline-variant/10">
                 <span className="material-symbols-outlined text-[64px]">account_circle</span>
              </div>
              <h4 className="font-display-lg text-2xl text-on-surface lowercase tracking-tighter mb-4">No dossier active</h4>
              <p className="font-label-md text-on-surface-variant text-[11px] uppercase tracking-[0.15em] opacity-40 leading-relaxed max-w-[280px]">
                Initiate a selection from the clientele manifest to synchronize detailed visit history and behavioral analytics.
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