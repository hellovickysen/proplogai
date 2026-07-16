'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LogoMark } from '@/components/Logo';

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  // When the route actually changes, navigation is done — hide the loader.
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Show the overlay only after a short delay so fast navigations never flash it.
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setVisible(true), 150);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [loading]);

  // Detect internal link clicks to know when a navigation has started.
  useEffect(() => {
    function handleClick(e) {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (anchor.target === '_blank') return;
      if (anchor.hasAttribute('download')) return;

      // Ignore clicks that don't actually change the route.
      const [hrefPath] = href.split('?');
      if (hrefPath === pathname) return;

      setLoading(true);
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#07070b]/80 backdrop-blur-sm transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <LogoMark size={48} rounded="rounded-2xl" glow />
        </div>
        <span className="text-sm text-white/50">Loading...</span>
      </div>
    </div>
  );
}
