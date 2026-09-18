"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type LoadingBarContextValue = {
  start: () => void;
  done: () => void;
};

const LoadingBarContext = createContext<LoadingBarContextValue | null>(null);

/**
 * Reference-counted: multiple concurrent start() calls (e.g. a route
 * change plus a Server Action firing at the same time) only hide the
 * bar once every one of them has called done().
 */
export function LoadingBarProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const activeCount = useRef(0);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trickleInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    if (trickleInterval.current) clearInterval(trickleInterval.current);
    hideTimeout.current = null;
    trickleInterval.current = null;
  }, []);

  const start = useCallback(() => {
    activeCount.current += 1;
    if (activeCount.current > 1) return; // already running

    clearTimers();
    setVisible(true);
    setProgress(8);

    // Trickle toward — but never reach — 90%, so the bar always looks
    // like it's making progress while we wait for the real thing to
    // finish, without ever claiming to be done prematurely.
    trickleInterval.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.1));
    }, 200);
  }, [clearTimers]);

  const done = useCallback(() => {
    activeCount.current = Math.max(0, activeCount.current - 1);
    if (activeCount.current > 0) return; // others still in flight

    clearTimers();
    setProgress(100);
    hideTimeout.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <LoadingBarContext.Provider value={{ start, done }}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5"
      >
        <div
          className="bg-primary h-full transition-[width,opacity] duration-200 ease-out"
          style={{
            width: `${progress}%`,
            opacity: visible ? 1 : 0,
          }}
        />
      </div>
      {children}
    </LoadingBarContext.Provider>
  );
}

export function useLoadingBar() {
  const ctx = useContext(LoadingBarContext);
  if (!ctx) {
    throw new Error("useLoadingBar must be used within a LoadingBarProvider");
  }
  return ctx;
}
