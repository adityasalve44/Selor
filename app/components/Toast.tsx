'use client';

import { createContext, useCallback, useContext, useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const toast = {
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    info: (msg: string) => add(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — above mobile nav */}
      <div
        aria-live="polite"
        className="fixed bottom-28 right-4 md:bottom-6 md:right-6 z-[200] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const icon =
    item.type === 'success' ? 'verified' : item.type === 'error' ? 'terminal' : 'info';

  const colors =
    item.type === 'success'
      ? 'bg-surface-container-low border-primary/20'
      : item.type === 'error'
      ? 'bg-surface-container-low border-error/20'
      : 'bg-surface-container-low border-outline-variant/20';

  const iconColor =
    item.type === 'success' ? 'text-primary' : item.type === 'error' ? 'text-error' : 'text-on-surface-variant opacity-40';

  return (
    <div
      className={`pointer-events-auto flex items-center gap-5 px-6 py-4 rounded-md border shadow-technical
        transition-all duration-500 max-w-sm
        ${colors}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconColor} bg-surface-container-high/40 shadow-inner`}>
        <span className="material-symbols-outlined text-[20px]">
          {icon}
        </span>
      </div>
      <div className="flex-1 space-y-1">
        <span className="font-label-md text-[10px] uppercase tracking-[0.2em] opacity-40 block">System Event</span>
        <span className="font-display-lg text-lg text-on-surface lowercase tracking-tighter block leading-tight">{item.message}</span>
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        className="text-on-surface-variant opacity-20 hover:opacity-100 transition-all shrink-0"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.toast;
}
