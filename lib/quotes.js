/** Dynamic motivational quotes based on P&L performance. */

const BIG_WIN = [
  '🚀 Skyrocketed.',
  '🌙 Landed on the moon.',
  '🔥 On fire today.',
  '💎 Diamond hands paid off.',
  '⚡ Unstoppable.',
];

const MED_WIN = [
  '📈 Solid execution.',
  '💰 Stacking pips.',
  '🎯 Clean trading.',
  '✅ The plan worked.',
  '🏆 Consistency wins.',
];

const SMALL_WIN = [
  '💚 Green is green.',
  '🧠 Discipline pays.',
  '📊 Every pip counts.',
  '🌱 Growth mindset.',
  '✊ Small wins compound.',
];

const BREAKEVEN = [
  'Breakeven. No damage done.',
  'Flat. Capital preserved.',
  'Zero P&L — discipline held.',
];

const SMALL_LOSS = [
  '🛡️ Part of the game.',
  '🧘 Stay disciplined.',
  '🌅 Tomorrow\'s another day.',
  '📝 Log it. Learn it. Move on.',
  '💪 Controlled loss = good loss.',
];

const MED_LOSS = [
  '🔄 Lessons > Losses.',
  '⏳ Refine. Reload. Return.',
  '📉 The comeback is loading.',
  '🧱 Building resilience.',
  '🎯 Recalibrating.',
];

const BIG_LOSS = [
  '🥊 Fall seven times, stand up eight.',
  '⚡ Your next win is loading.',
  '🦁 Scars make warriors.',
  '🔥 Forge through the fire.',
  '🏔️ Every mountain has a valley.',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getQuote(pnl) {
  const v = Number(pnl) || 0;
  if (v >= 500) return pick(BIG_WIN);
  if (v >= 100) return pick(MED_WIN);
  if (v === 0) return pick(BREAKEVEN);
  if (v > 0) return pick(SMALL_WIN);
  if (v >= -100) return pick(SMALL_LOSS);
  if (v >= -500) return pick(MED_LOSS);
  return pick(BIG_LOSS);
}

export function getQuoteForTrade(pnl) {
  return getQuote(pnl);
}
