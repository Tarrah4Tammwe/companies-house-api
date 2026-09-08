import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normaliseCompanyNumber } from "./company-number.ts";

describe("normaliseCompanyNumber", () => {
  it("pads standard England/Wales numbers", () => {
    assert.equal(normaliseCompanyNumber("12345678"), "12345678");
    assert.equal(normaliseCompanyNumber("1234567"), "01234567");
    assert.equal(normaliseCompanyNumber(" 00445790 "), "00445790");
  });

  it("handles hyphenated and lowercase input", () => {
    assert.equal(normaliseCompanyNumber("sc-123456"), "SC123456");
    assert.equal(normaliseCompanyNumber("ni012345"), "NI012345");
  });

  it("handles prefixed jurisdictions", () => {
    assert.equal(normaliseCompanyNumber("SC123456"), "SC123456");
    assert.equal(normaliseCompanyNumber("NI123456"), "NI123456");
    assert.equal(normaliseCompanyNumber("OC123456"), "OC123456");
    assert.equal(normaliseCompanyNumber("R1234567"), "R1234567");
  });

  it("rejects path traversal and junk that must never hit the upstream path", () => {
    assert.equal(normaliseCompanyNumber("../etc"), null);
    assert.equal(normaliseCompanyNumber("..%2fsecret"), null);
    assert.equal(normaliseCompanyNumber("http://evil"), null);
    assert.equal(normaliseCompanyNumber("123456789"), null);
    assert.equal(normaliseCompanyNumber("SC12345678"), null);
    assert.equal(normaliseCompanyNumber(""), null);
    assert.equal(normaliseCompanyNumber("****"), null);
    assert.equal(normaliseCompanyNumber("SC12AB56"), null);
  });
});
