import { useState, useEffect, useCallback } from "react";

const DESKTOP_BREAKPOINT = 768;

export function useResponsive() {
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= DESKTOP_BREAKPOINT
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const suffix = isDesktop ? "-desktop" : "-responsive";

  const tid = useCallback((base) => `${base}${suffix}`, [suffix]);

  return { isDesktop, suffix, tid };
}
