import assert from "node:assert/strict";
import test from "node:test";
import { resolveAnalyticsAccountId, readAnalyticsAccountScope, canReviewAnalyticsTrade, canAccessEffectiveAccountTrade } from "./analytics-account-scope.mjs";
const user = { id: "owner", email: "owner@example.test" };
const now = new Date("2026-11-14T06:00:00Z");
const selected = { active_account_id: "A" };
const paid = { status: "active", razorpay_subscription_id: "paid-reference" };

function fakeDb({ preferences = selected, subscription = null, accounts = [{ id: "A", name: "Main", user_id: user.id, is_archived: false }], trades = [], fail = null, throws = false } = {}) {
  const calls = [];
  const tables = { user_preferences: [{ ...preferences, user_id: user.id }], subscriptions: subscription ? [{ ...subscription, user_id: user.id }] : [], accounts, trades };
  return { calls, from(table) {
    const filters = []; calls.push({ table, filters });
    const query = { select() { return query; }, eq(key, value) { filters.push([key, value]); return query; }, async maybeSingle() {
      if (throws) throw new Error("connection lost");
      if (fail === table) return { error: { message: "read failed" }, data: null };
      const rows = (tables[table] || []).filter(row => filters.every(([key, value]) => row[key] === value));
      return { data: rows[0] || null, error: null };
    } };return query;
  } };
}

test("Basic access ignores a stale account selection and editable preference flags", () => {
  assert.equal(resolveAnalyticsAccountId({ user, preferences: { ...selected, is_admin: true }, subscription: null, now }), null);
  assert.equal(resolveAnalyticsAccountId({ user, preferences: selected, subscription: { status: "active" }, now }), null);
  assert.equal(resolveAnalyticsAccountId({ user, preferences: selected, subscription: { ...paid, status: "cancelled" }, now }), null);
});

test("paid, trial and configured administrator selection matches the dashboard header", () => {
  for (const status of ["active", "authenticated"]) assert.equal(resolveAnalyticsAccountId({ user, preferences: selected, subscription: { ...paid, status }, now }), "A");
  assert.equal(resolveAnalyticsAccountId({ user, preferences: selected, subscription: { trial_ends_at: "2026-11-14T06:00:01Z" }, now }), "A");
  assert.equal(resolveAnalyticsAccountId({ user, preferences: selected, subscription: { trial_ends_at: now.toISOString() }, now }), null);
  assert.equal(resolveAnalyticsAccountId({ user, preferences: selected, subscription: { trial_ends_at: "invalid" }, now }), null);
  assert.equal(resolveAnalyticsAccountId({ user, preferences: selected, adminEmail: user.email, now }), "A");
  assert.equal(resolveAnalyticsAccountId({ user, preferences: {}, subscription: paid, now }), null);
  assert.equal(resolveAnalyticsAccountId({ user: null, preferences: selected, subscription: paid, now }), null);
});

test("scope reads stay owner-bound and selected accounts must be active and owned", async () => {
  const db = fakeDb({ subscription: paid });
  const scope = await readAnalyticsAccountScope(db, user, { now, adminEmail: "" });
  assert.deepEqual(scope, { activeAccountId: "A", accountScope: "selected account (Main)", error: null });
  for (const call of db.calls) assert.ok(call.filters.some(([key, value]) => key === "user_id" && value === user.id), call.table);
  assert.ok(db.calls.find(c => c.table === "accounts").filters.some(([key, value]) => key === "is_archived" && value === false));
  const basic = fakeDb();
  assert.deepEqual(await readAnalyticsAccountScope(basic, user, { now, adminEmail: "" }), { activeAccountId: null, accountScope: "all accounts", error: null });
  assert.equal(basic.calls.some(c => c.table === "accounts"), false);
});

test("foreign, archived and missing saved selections fail without widening to All Accounts", async () => {
  for (const accounts of [[], [{ id: "A", name: "Foreign", user_id: "other", is_archived: false }], [{ id: "A", name: "Archived", user_id: user.id, is_archived: true }]]) {
    const scope = await readAnalyticsAccountScope(fakeDb({ subscription: paid, accounts }), user, { now, adminEmail: "" });
    assert.ok(scope.error);
    assert.equal(canReviewAnalyticsTrade({ user_id: user.id, account_id: "A" }, user.id, scope), false);
  }
});

test("account read failures and missing authentication fail closed", async () => {
  for (const fail of ["user_preferences", "subscriptions", "accounts"]) {
    const scope = await readAnalyticsAccountScope(fakeDb({ subscription: paid, fail }), user, { now, adminEmail: "" });
    assert.ok(scope.error, fail);
    assert.equal(Object.hasOwn(scope, "activeAccountId"), false);
  }
  assert.ok((await readAnalyticsAccountScope(fakeDb({ throws: true }), user)).error);
  const db = fakeDb(); assert.ok((await readAnalyticsAccountScope(db, null)).error);assert.equal(db.calls.length, 0);
});

test("review permissions enforce ownership and the effective selected account for reads and saves", () => {
  const own = { user_id: user.id, account_id: "A" };
  const account = { activeAccountId: "A", error: null }, all = { activeAccountId: null, error: null };
  assert.equal(canReviewAnalyticsTrade(own, user.id, account), true);
  assert.equal(canReviewAnalyticsTrade({ ...own, account_id: "B" }, user.id, account), false);
  assert.equal(canReviewAnalyticsTrade({ ...own, account_id: "B" }, user.id, all), true);
  assert.equal(canReviewAnalyticsTrade({ ...own, account_id: null }, user.id, all), true);
  assert.equal(canReviewAnalyticsTrade({ ...own, user_id: "other" }, user.id, all), false);
  for (const scope of [undefined, {}, { activeAccountId: undefined }, { activeAccountId: "" }, { activeAccountId: 0 }, { error: "unavailable" }, { activeAccountId: "A", error: "unavailable" }]) assert.equal(canReviewAnalyticsTrade(own, user.id, scope), false);
  assert.equal(canReviewAnalyticsTrade(null, user.id, all), false);
  assert.equal(canReviewAnalyticsTrade(own, null, all), false);
});


test("existing-trade actions match Basic and paid effective scope and always check ownership", async () => {
  const ownedA = { id: "trade-a", user_id: user.id, account_id: "A" };
  const ownedB = { id: "trade-b", user_id: user.id, account_id: "B" };
  const foreign = { id: "foreign", user_id: "other", account_id: "B" };
  const options = { now, adminEmail: "" };
  const basic = fakeDb({ trades: [ownedA, ownedB, foreign] });
  assert.equal(await canAccessEffectiveAccountTrade(basic, user, "trade-b", options), true);
  assert.equal(await canAccessEffectiveAccountTrade(basic, user, "foreign", options), false);
  assert.equal(await canAccessEffectiveAccountTrade(basic, user, "missing", options), false);
  for (const call of basic.calls.filter(call => call.table === "trades")) {
    assert.ok(call.filters.some(([key, value]) => key === "user_id" && value === user.id));
    assert.ok(call.filters.some(([key]) => key === "id"));
  }
  const paidDb = fakeDb({ subscription: paid, trades: [ownedA, ownedB, foreign] });
  assert.equal(await canAccessEffectiveAccountTrade(paidDb, user, "trade-a", options), true);
  assert.equal(await canAccessEffectiveAccountTrade(paidDb, user, "trade-b", options), false);
  const all = fakeDb({ subscription: paid, preferences: {}, trades: [ownedA, ownedB] });
  assert.equal(await canAccessEffectiveAccountTrade(all, user, "trade-b", options), true);
});

test("existing-trade actions fail closed on invalid selections, query failures or missing auth", async () => {
  const trades = [{ id: "trade-a", user_id: user.id, account_id: "A" }];
  for (const fail of ["user_preferences", "subscriptions", "accounts", "trades"]) {
    const db = fakeDb({ subscription: paid, trades, fail });
    assert.equal(await canAccessEffectiveAccountTrade(db, user, "trade-a", { now, adminEmail: "" }), false, fail);
  }
  for (const accounts of [[], [{ id: "A", name: "Archived", user_id: user.id, is_archived: true }], [{ id: "A", name: "Foreign", user_id: "other", is_archived: false }]]) {
    assert.equal(await canAccessEffectiveAccountTrade(fakeDb({ subscription: paid, trades, accounts }), user, "trade-a", { now, adminEmail: "" }), false);
  }
  const db = fakeDb({ trades });
  assert.equal(await canAccessEffectiveAccountTrade(db, null, "trade-a"), false);
  assert.equal(await canAccessEffectiveAccountTrade(db, user, ""), false);
  assert.equal(db.calls.length, 0);
});
