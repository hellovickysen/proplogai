-- Prop Firms table (admin-managed challenge profiles)
CREATE TABLE IF NOT EXISTS prop_firms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  profit_target NUMERIC NOT NULL DEFAULT 8,
  daily_drawdown NUMERIC NOT NULL DEFAULT 2,
  overall_drawdown NUMERIC NOT NULL DEFAULT 4,
  min_trading_days INTEGER NOT NULL DEFAULT 5,
  challenge_days INTEGER NOT NULL DEFAULT 30,
  max_risk_per_trade NUMERIC,
  consistency_requirement NUMERIC,
  affiliate_link TEXT,
  logo_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed with initial generic profiles
INSERT INTO prop_firms (name, slug, profit_target, daily_drawdown, overall_drawdown, min_trading_days, challenge_days, display_order, active)
VALUES
  ('One-Step Challenge', 'one-step', 8, 2, 4, 5, 30, 1, true),
  ('Two-Step Challenge', 'two-step', 8, 2, 4, 5, 30, 2, true),
  ('Instant Funding', 'instant', 0, 2, 4, 5, 30, 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Tool leads table (email capture from probability analyzer)
CREATE TABLE IF NOT EXISTS tool_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  otp_code TEXT,
  otp_expires TIMESTAMPTZ,
  otp_attempts INTEGER NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'probability-analyzer',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_leads_email ON tool_leads (email);
CREATE INDEX IF NOT EXISTS idx_tool_leads_verified ON tool_leads (verified) WHERE verified = true;

-- RLS: prop_firms readable by everyone (public tool), writable only via service role
ALTER TABLE prop_firms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prop_firms_public_read" ON prop_firms FOR SELECT USING (true);

-- RLS: tool_leads only via service role (no client access)
ALTER TABLE tool_leads ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
