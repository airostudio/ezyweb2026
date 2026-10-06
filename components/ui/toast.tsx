"use client";

import { AnimatePresence, m } from "framer-motion";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/** Minimal, accessible toast system (polite live region, auto-dismiss). */
interface Toast {
  id: number;
  message: string;
  emoji?: string;
}

const ToastCtx = createContext<(message: string, emoji?: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((message: string, emoji?: string) => {
    const id = ++nextId.current;
    setToasts((t) => [...t.slice(-2), { id, message, emoji }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <m.div
              key={t.id}
              className="toast"
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
            >
              {t.emoji && <span aria-hidden>{t.emoji}</span>}
              <span>{t.message}</span>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
