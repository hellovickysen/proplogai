'use client';

import { useEffect, useRef } from 'react';

/**
 * Tiny client component that scrolls itself into view when its target changes.
 * Used to auto-scroll to the trades section after each date selection.
 */
export default function ScrollIntoView({ target }) {
  const ref = useRef(null);
  useEffect(() => {
    // Small delay to let the page render first
    const t = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(t);
  }, [target]);
  return <div ref={ref} className="-mt-4" />;
}
