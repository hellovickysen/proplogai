"use client";
import { useEffect, useState } from 'react';

export default function OverflowDebug() {
  const [info, setInfo] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      const vw = window.innerWidth;
      const dw = document.documentElement.scrollWidth;
      const bw = document.body.scrollWidth;
      const culprits = [];
      document.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.right > vw + 2 && r.width > 0) {
          const cls = (el.className || '').toString().substring(0, 50);
          const tag = el.tagName.toLowerCase();
          culprits.push(tag + ' r:' + Math.round(r.right) + ' w:' + Math.round(r.width) + ' ' + cls);
        }
      });
      setInfo('vw:' + vw + ' dw:' + dw + ' bw:' + bw + ' overflow:' + culprits.length + ' | ' + culprits.slice(0, 8).join(' | '));
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  if (!info) return null;
  return (
    <div style={{ position: 'fixed', bottom: 70, left: 4, right: 4, zIndex: 9999, background: '#1a0030', border: '2px solid #a78bfa', color: '#22d3ee', fontSize: 9, fontFamily: 'monospace', padding: 6, borderRadius: 8, maxHeight: 180, overflow: 'auto', wordBreak: 'break-all' }}>
      {info}
    </div>
  );
}
