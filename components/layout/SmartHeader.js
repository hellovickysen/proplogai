'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * SmartHeader — sticky header that hides on scroll down, reveals on scroll up.
 */
export default function SmartHeader({ children }) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (currentY < 60) {
          // Near top — always show
          setVisible(true);
        } else if (delta > 5) {
          // Scrolling down past threshold — hide
          setVisible(false);
        } else if (delta < -5) {
          // Scrolling up past threshold — show
          setVisible(true);
        }

        lastScrollY.current = currentY;
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={
        'sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#07070b]/95 backdrop-blur-md px-3 py-3 sm:px-6 sm:py-4 transition-transform duration-300 ease-in-out ' +
        (visible ? 'translate-y-0' : '-translate-y-full')
      }
    >
      {children}
    </header>
  );
}
