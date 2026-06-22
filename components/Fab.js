import Link from 'next/link';

export default function Fab() {
  return (
    <Link
      href="/dashboard/trades/new"
      aria-label="Log new trade"
      className="fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-full text-3xl font-light text-[#08080f]"
      style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', boxShadow: '0 8px 30px rgba(139,92,246,0.5)' }}
    >
      +
    </Link>
  );
}
