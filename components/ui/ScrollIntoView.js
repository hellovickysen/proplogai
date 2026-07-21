'use client';

import { useEffect, useRef } from 'react';

/**
 * Tiny client component that scrolls itself into view on mount.
 * Used to auto-scroll to the trades section after date selection.
 */
export default function ScrollIntoView() {
  const ref = useRef(null);
  useEffect(() => {
    // Small delay to let the page render first
    const t = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(t);
  }, []);
  return <div ref={ref} className="-mt-4" />;
}
