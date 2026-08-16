/**
 * Hero dashboard — REAL PropLogAI dashboard screenshot inside a browser frame.
 * Image lives at public/landing/dashboard.webp (owner uploads it; binary can't
 * go through the agent's GitHub tools).
 */
const DASHBOARD_IMG = '/landing/dashboard.webp';

export default function HeroDashboardMock() {
  return (
    <div
      className="product-mockup relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0a0c16]/95 shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      aria-label="PropLogAI discipline dashboard"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#fb7185]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]/70" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-md border border-white/[0.06] bg-black/30 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-[10px] text-white/40">proplogai.com/dashboard</span>
        </div>
        <span className="hidden rounded-full border border-[#8b7cf6]/30 bg-[#8b7cf6]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#b3a5f8] sm:block">
          Live product
        </span>
      </div>

      {/* Real screenshot */}
      <img
        src={DASHBOARD_IMG}
        alt="PropLogAI dashboard showing today's coaching, discipline score, rulebook breakdown, and journal streaks"
        className="block h-auto w-full"
        loading="eager"
      />
    </div>
  );
}
