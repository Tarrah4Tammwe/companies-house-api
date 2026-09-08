import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { coerceBoolean, parseLimit, sanitiseSearchQuery } from "./coerce.ts";

describe("coerceBoolean", () => {
  it("accepts marketplace string/number forms", () => {
    assert.equal(coerceBoolean(true), true);
    assert.equal(coerceBoolean("true"), true);
    assert.equal(coerceBoolean("TRUE"), true);
    assert.equal(coerceBoolean("1"), true);
    assert.equal(coerceBoolean(1), true);
    assert.equal(coerceBoolean("yes"), true);
    assert.equal(coerceBoolean(false), false);
    assert.equal(coerceBoolean("false"), false);
    assert.equal(coerceBoolean("0"), false);
    assert.equal(coerceBoolean(undefined), false);
  });
});

describe("parseLimit", () => {
  it("caps, falls back, and rejects NaN", () => {
    assert.equal(parseLimit("5"), 5);
    assert.equal(parseLimit("20"), 20);
    assert.equal(parseLimit("99"), 20);
    assert.equal(parseLimit("abc"), 5);
    assert.equal(parseLimit("0"), 5);
    assert.equal(parseLimit("-3"), 5);
    assert.equal(parseLimit(null), 5);
  });
});

describe("sanitiseSearchQuery", () => {
  it("trims and rejects empty, oversized, or control characters", () => {
    assert.equal(sanitiseSearchQuery("  Tesco  "), "Tesco");
    assert.equal(sanitiseSearchQuery(""), null);
    assert.equal(sanitiseSearchQuery("a".repeat(161)), null);
    assert.equal(sanitiseSearchQuery("bad\nquery"), null);
  });
});
