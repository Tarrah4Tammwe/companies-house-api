import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSafeUpstreamPath } from "./ch-client.ts";

describe("isSafeUpstreamPath", () => {
  it("allows company and search paths", () => {
    assert.equal(isSafeUpstreamPath("/company/00445790"), true);
    assert.equal(
      isSafeUpstreamPath("/search/companies?q=tesco&items_per_page=5"),
      true
    );
  });

  it("rejects traversal and absolute URLs", () => {
    assert.equal(isSafeUpstreamPath("/company/../secrets"), false);
    assert.equal(isSafeUpstreamPath("https://evil.example/"), false);
    assert.equal(isSafeUpstreamPath("company/00445790"), false);
  });
});
