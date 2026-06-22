"use client";

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const toast = useCallback({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }, [addToast]);

  // Make toast callable as toast.success() etc
  const api = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toast container — top right */}
      <div className="fixed right-4 top-4 z-[60] flex flex-col gap-2" style={{ pointerEvents: 'none' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'animate-slide-in rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm ' +
              (t.type === 'success'
                ? 'border-emerald-400/20 bg-emerald-500/15 text-emerald-300'
                : t.type === 'error'
                ? 'border-red-400/20 bg-red-500/15 text-red-300'
                : 'border-cyan-400/20 bg-cyan-500/15 text-cyan-300')
            }
            style={{ pointerEvents: 'auto', minWidth: 220 }}
          >
            <span className="mr-2">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
