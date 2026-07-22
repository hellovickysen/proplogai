export const gradientText = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
export const gradientBtn = { background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' };
export const redGlow = { textShadow: '0 0 40px rgba(248,113,113,0.3)' };

export const PAIN_CARDS = [
  {
    icon: '🔥',
    title: 'You revenge trade after losses',
    desc: 'Two losses hit. You feel the tilt. You take a setup you know is trash — and give back the whole day. Again.',
    stat: '-$340',
    statLabel: 'avg cost per revenge day',
  },
  {
    icon: '🚫',
    title: 'You break your own rules',
    desc: 'You wrote the rules. You know the rules. Then the market moves and the rules disappear. Every. Single. Time.',
    stat: '67%',
    statLabel: 'of blown challenges are rule breaks',
  },
  {
    icon: '🔁',
    title: 'You can\'t see the pattern',
    desc: 'It\'s the same mistake wearing different setups. But without data, you\'ll repeat it until the next challenge fee.',
    stat: '3.2x',
    statLabel: 'avg times same leak repeats',
  },
];

export const STATS = [
  { value: 85, suffix: '%', label: 'of prop challenges end in failure', sub: 'Not because of bad strategy. Because of untracked psychology.' },
  { value: 200, suffix: '+', prefix: '$', label: 'burned per failed challenge', sub: 'That\'s the price of repeating mistakes you can\'t see.' },
  { value: 1, suffix: '', label: 'pattern is costing you everything', sub: 'Most traders have one core leak. Find it or keep paying for it.' },
];

export const FEATURES = [
  { icon: '✦', title: 'Propol trade analysis', desc: 'Every trade scored by your AI coach Propol. Discipline, psychology, performance, and execution — graded with evidence from your own journal.', live: true },
  { icon: '🧠', title: 'Psychology tracking', desc: 'Tag emotions on every trade. See which feelings correlate with your worst days. Stop trading blind.', live: true },
  { icon: '📊', title: 'Propol monthly review', desc: 'Deep-dive performance review with 5 scores, recurring mistake detection, emotional patterns, and a personalized action plan — all from your data.', live: true },
  { icon: '📅', title: 'P&L calendar', desc: 'Visual monthly grid with daily P&L. Spot losing streaks, revenge days, and session patterns at a glance.', live: true },
  { icon: '☰', title: 'One-tap trade logging', desc: 'Pair, direction, session, setup, P&L — logged in 30 seconds. No excuses to skip it.', live: true },
  { icon: '📏', title: 'Rulebook discipline', desc: 'Define your setups. Track if you followed them. Propol scores your discipline and catches drift.', live: true },
  { icon: '🔍', title: 'Smart filters', desc: 'Filter by result, setup, emotion, session. Find exactly which patterns make or lose you money.', live: true },
  { icon: '💰', title: 'Expense tracker', desc: 'Track challenge fees, activation costs, renewals, and payouts. Know your real ROI across all prop firms.', live: true },
  { icon: '🏆', title: 'Trophy wall & proof', desc: 'Upload payout certificates and funded-account wins. Share verified proof pages with anyone.', live: true },
  { icon: '🔗', title: 'Public trader profile', desc: 'Share your verified trading story — calendar, trades, payouts, trophies — controlled from your settings.', live: true },
  { icon: '📤', title: 'Shareable P&L cards', desc: 'Download branded cards for social media. Dynamic quotes. Turn every green day into social proof.', live: true },
  { icon: '🎁', title: 'Referral rewards', desc: 'Invite traders. Earn credit when they build a real journaling habit. Everyone wins.', live: true },
  { icon: '🤖', title: 'Telegram bot', desc: 'Log trades from Telegram. "/log XAU/USD long +$145" and done. No app needed.', coming: true },
  { icon: '🌐', title: 'Cross-user intelligence', desc: 'See which mistakes and setups are trending across funded traders. Anonymized aggregate insights.', coming: true },
];
