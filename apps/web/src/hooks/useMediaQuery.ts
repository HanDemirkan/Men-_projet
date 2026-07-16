"use client";

import { useEffect, useState } from "react";

// SSR-safe: starts `false` on the server and syncs to the real value after
// mount, so `PanelLayout` never renders mismatched desktop/mobile markup.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener("change", listener);

    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
