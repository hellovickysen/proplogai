"use server";

// Manual rule reviews are retired. Keep stale clients from writing evaluations.
export async function backfillTradeRuleChecks() {
  return { error: "Manual rule reviews are currently unavailable." };
}

export async function saveTradeRuleReview() {
  return { error: "Manual rule reviews are currently unavailable." };
}
