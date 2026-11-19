// Mirror the dashboard header's account access, not stale preferences alone.
export function resolveAnalyticsAccountId({ user, preferences, subscription, adminEmail = "", now = new Date() }) {
  if (!user?.id) return null;
  const admin = Boolean(adminEmail) && user?.email === adminEmail;
  const paid = Boolean(subscription?.razorpay_subscription_id) && ["active", "authenticated"].includes(subscription?.status);
  const trial = Number.isFinite(Date.parse(subscription?.trial_ends_at)) && Date.parse(subscription.trial_ends_at) > new Date(now).getTime();
  return admin || paid || trial ? preferences?.active_account_id || null : null;
}

export async function readAnalyticsAccountScope(supabase, user, { adminEmail = process.env.ADMIN_EMAIL || "", now = new Date() } = {}) {
  if (!user?.id) return { error: "You must be signed in." };
  try {
    const [preferences, subscription] = await Promise.all([
      supabase.from("user_preferences").select("active_account_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("status,razorpay_subscription_id,trial_ends_at").eq("user_id", user.id).maybeSingle(),
    ]);
    if (preferences.error || subscription.error) return { error: "Unable to load account selection. Refresh and try again." };
    const activeAccountId = resolveAnalyticsAccountId({ user, preferences: preferences.data, subscription: subscription.data, adminEmail, now });
    if (!activeAccountId) return { activeAccountId: null, accountScope: "all accounts", error: null };
    const { data: account, error } = await supabase.from("accounts").select("id,name")
      .eq("id", activeAccountId).eq("user_id", user.id).eq("is_archived", false).maybeSingle();
    if (error || !account) return { error: "The selected account is unavailable. Choose an active account and refresh." };
    return { activeAccountId: account.id, accountScope: "selected account (" + account.name + ")", error: null };
  } catch {
    return { error: "Unable to load account selection. Refresh and try again." };
  }
}

export function canReviewAnalyticsTrade(trade, userId, scope) {
  if (!scope || scope.error || !Object.hasOwn(scope, "activeAccountId")) return false;
  const selected = scope.activeAccountId;
  if (selected !== null && (typeof selected !== "string" || !selected)) return false;
  return Boolean(trade && userId && trade.user_id === userId
    && (selected === null || trade.account_id === selected));
}

// Existing-trade actions share the list/detail scope; new-trade assignment stays separate.
export async function canAccessEffectiveAccountTrade(supabase, user, tradeId, options) {
  if (!user?.id || !tradeId) return false;
  try {
    const scope = await readAnalyticsAccountScope(supabase, user, options);
    if (scope.error) return false;
    const { data: trade, error } = await supabase.from("trades")
      .select("user_id,account_id").eq("id", tradeId).eq("user_id", user.id).maybeSingle();
    return !error && canReviewAnalyticsTrade(trade, user.id, scope);
  } catch {
    return false;
  }
}
