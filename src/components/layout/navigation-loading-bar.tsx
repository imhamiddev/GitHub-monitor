"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { useLoadingBar } from "@/components/layout/loading-bar";

/**
 * Two triggers work together here:
 *
 * 1. A capturing document click listener starts the bar the instant
 *    the user clicks any internal <a>/<Link> - before Next.js has even
 *    begun fetching the next route's data, which is when it matters
 *    most for perceived responsiveness.
 * 2. Whenever pathname/searchParams actually change (the new route has
 *    committed), we call done() - closing out whichever start() is
 *    still open, whether it came from the click listener or from
 *    router.push() called out of a Server Action.
 */
function NavigationLoadingBarInner() {
  const { start, done } = useLoadingBar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const pendingFromClick = useRef(false);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return; // same page, nothing to show progress for
      }

      pendingFromClick.current = true;
      start();
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [start]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (pendingFromClick.current) {
      pendingFromClick.current = false;
      done();
    }
  }, [pathname, searchParams, done]);

  return null;
}

export function NavigationLoadingBar() {
  return (
    <Suspense fallback={null}>
      <NavigationLoadingBarInner />
    </Suspense>
  );
}
