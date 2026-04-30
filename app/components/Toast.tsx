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
    // mount with slight delay to trigger CSS transition
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const icon =
    item.type === 'success' ? 'check_circle' : item.type === 'error' ? 'error' : 'info';

  const colors =
    item.type === 'success'
      ? 'bg-surface-container-lowest border-primary/30 text-on-surface'
      : item.type === 'error'
      ? 'bg-surface-container-lowest border-error/30 text-on-surface'
      : 'bg-surface-container-lowest border-outline/30 text-on-surface';

  const iconColor =
    item.type === 'success' ? 'text-primary' : item.type === 'error' ? 'text-error' : 'text-tertiary';

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm
        transition-all duration-300 max-w-sm
        ${colors}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
    >
      <span className={`material-symbols-outlined text-[20px] shrink-0 ${iconColor}`}
        style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <span className="font-label-md text-sm flex-1">{item.message}</span>
      <button
        onClick={() => onDismiss(item.id)}
        className="text-outline hover:text-on-surface transition-colors shrink-0"
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
