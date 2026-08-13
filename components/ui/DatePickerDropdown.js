"use client";

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function DatePickerDropdown({ label, value, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value + 'T00:00:00') : new Date());
  const [position, setPosition] = useState(null);
  const ref = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (value) setViewDate(new Date(value + 'T00:00:00'));

    function updatePosition() {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 280;
      const height = 350;
      const margin = 12;
      const placeAbove = window.innerHeight - rect.bottom < height && rect.top > height;
      setPosition({
        left: Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin),
        top: placeAbove ? Math.max(margin, rect.top - height - 8) : rect.bottom + 8,
      });
    }

    function handleClick(event) {
      if (ref.current?.contains(event.target) || popoverRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    updatePosition();
    document.addEventListener('click', handleClick);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const selected = value ? new Date(value + 'T00:00:00') : null;
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const displayValue = selected ? selected.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Select date';

  function selectDay(day) {
    onChange(year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0'));
    setOpen(false);
  }

  return (
    <div ref={ref} className={'relative ' + className}>
      {label && <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">{label}</label>}
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-left text-sm outline-none transition-colors hover:border-white/20 focus:border-cyan-400/60">
        <span className={value ? 'text-white' : 'text-white/50'}>{displayValue}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-white/40"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></svg>
      </button>
      {open && position && typeof document !== 'undefined' && createPortal(
        <div ref={popoverRef} className="fixed z-[10001] w-[280px] rounded-xl border border-white/10 bg-[#12121a] p-3 shadow-2xl" style={{ left: position.left, top: position.top }}>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-lg text-white/60 hover:bg-white/[0.08] hover:text-white">&#8249;</button>
            <span className="text-sm font-semibold text-white/85">{monthLabel}</span>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-lg text-white/60 hover:bg-white/[0.08] hover:text-white">&#8250;</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-white/35">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day} className="py-1">{day}</span>)}
            {Array.from({ length: firstDay }).map((_, index) => <span key={'blank-' + index} />)}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
              const isSelected = selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
              const today = new Date();
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              return <button key={day} type="button" onClick={() => selectDay(day)} className={'h-8 rounded-lg text-xs transition-colors ' + (isSelected ? 'bg-cyan-400 font-bold text-[#08080f]' : isToday ? 'border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10' : 'text-white/70 hover:bg-white/[0.08] hover:text-white')}>{day}</button>;
            })}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-xs text-white/45 hover:text-white/70">Clear</button>
            <button type="button" onClick={() => { const today = new Date(); setViewDate(today); onChange(today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')); setOpen(false); }} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">Today</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
