'use client';

import { useEffect, ReactNode } from 'react';
import Lenis from 'lenis';

interface SmoothScrollProps {
  children: ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    // Disable Lenis when prefers-reduced-motion is active
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    // Disable Lenis on mobile devices or low-RAM devices (< 4GB)
    const isMobile = window.innerWidth < 768;
    const isLowMemory =
      typeof navigator !== 'undefined' &&
      'deviceMemory' in navigator &&
      (navigator as any).deviceMemory < 4;

    if (isMobile || isLowMemory) {
      return;
    }

    const lenis = new Lenis({
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
