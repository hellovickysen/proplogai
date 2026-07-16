'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * SmartHeader — sticky header that hides on scroll down, reveals on scroll up.
 * Wraps the dashboard header content.
 */
export default function SmartHeader({ children }) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const headerRef = useRef(null);

  useEffect(() => {
    // Find the scrollable container — the main content area (parent of <main>)
    // In the layout, the header is inside a flex column div that scrolls
    const scrollParent = headerRef.current?.closest('.flex-1.flex-col') || window;
    const getScrollY = () => scrollParent === window ? window.scrollY : scrollParent.scrollTop;

    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const currentY = getScrollY();
        const delta = currentY - lastScrollY.current;

        // Only trigger after a meaningful scroll (threshold: 5px)
        if (Math.abs(delta) > 5) {
          if (delta > 0 && currentY > 60) {
            // Scrolling down & past the header height — hide
            setVisible(false);
          } else {
            // Scrolling up — show
            setVisible(true);
          }
        }

        lastScrollY.current = currentY;
        ticking = false;
      });
    }

    const target = scrollParent === window ? window : scrollParent;
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      ref={headerRef}
      className={
        'sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#07070b]/95 backdrop-blur-md px-3 py-3 sm:px-6 sm:py-4 transition-transform duration-300 ease-in-out ' +
        (visible ? 'translate-y-0' : '-translate-y-full')
      }
    >
      {children}
    </header>
  );
}
