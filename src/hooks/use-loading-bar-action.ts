"use client";

import { useCallback } from "react";

import { useLoadingBar } from "@/components/layout/loading-bar";

/**
 * Wraps an async function so the global top loading bar shows while it
 * runs. Usage:
 *
 *   const runWithBar = useLoadingBarAction();
 *   startTransition(() => runWithBar(async () => { ... }));
 *
 * or, outside a transition, simply:
 *
 *   await runWithBar(() => someServerAction(args));
 */
export function useLoadingBarAction() {
  const { start, done } = useLoadingBar();

  return useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      start();
      try {
        return await action();
      } finally {
        done();
      }
    },
    [start, done]
  );
}
