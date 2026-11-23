import assert from "node:assert/strict";
import test from "node:test";
import { readTradeListJournals } from "./trade-list-data.mjs";

function database({ failBatch = -1, throws = false } = {}) {
  const calls = [];
  return { calls, from(table) {
    const call = { table }; calls.push(call);
    const index = calls.length - 1;
    const query = {
      select(columns) { call.columns = columns; return query; },
      eq(key, value) { call.owner = [key, value]; return query; },
      async in(key, values) {
        call.filter = key; call.ids = values;
        if (throws) throw new Error("offline");
        return index === failBatch ? { data: null, error: { message: "query failed" } }
          : { data: values.map(trade_id => ({ trade_id, tags: ["saved"], screenshot_urls: ["owned-image"], emotions: ["Disciplined"] })), error: null };
      },
    }; return query;
  } };
}

test("214 trade journals use bounded owner-scoped filters and retain all metadata", async () => {
  const db = database(), ids = Array.from({ length: 214 }, (_, i) => `trade-${i}`);
  const result = await readTradeListJournals(db, "owner", [...ids, ids[0]]);
  assert.equal(result.error, null);
  assert.equal(result.data.length, 214);
  assert.equal(new Set(result.data.map(row => row.trade_id)).size, 214);
  assert.deepEqual(db.calls.map(call => call.ids.length), [100, 100, 14]);
  for (const call of db.calls) {
    assert.equal(call.table, "journal_entries");
    assert.deepEqual(call.owner, ["user_id", "owner"]);
    assert.equal(call.filter, "trade_id");
    assert.ok(call.columns.includes("screenshot_urls"));
  }
  assert.ok(result.data.every(row => row.tags[0] === "saved" && row.emotions[0] === "Disciplined" && row.screenshot_urls[0] === "owned-image"));
});

test("empty, missing auth and failed batches do not return misleading partial data", async () => {
  const db = database();
  assert.deepEqual(await readTradeListJournals(db, "owner", []), { data: [], error: null });
  assert.ok((await readTradeListJournals(db, null, ["trade"])).error);
  assert.equal(db.calls.length, 0);
  const input = Array.from({ length: 101 }, (_, i) => `trade-${i}`);
  for (const options of [{ failBatch: 1 }, { throws: true }]) {
    const result = await readTradeListJournals(database(options), "owner", input);
    assert.equal(result.data, null);
    assert.ok(result.error);
  }
});
