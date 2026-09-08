import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveFilingDescription } from "./filings.ts";

describe("resolveFilingDescription", () => {
  it("uses type labels when no description key is known", () => {
    assert.equal(resolveFilingDescription("", {}, "CS01"), "Confirmation statement filed");
  });

  it("interpolates officer name and date when present", () => {
    assert.equal(
      resolveFilingDescription(
        "appointment-person-director-company-with-name-date",
        { officer_name: "SMITH, Jane", date: "2020-01-15" },
        "AP01"
      ),
      "Director appointed: SMITH, Jane, 2020-01-15"
    );
  });

  it("title-cases unknown keys", () => {
    assert.equal(
      resolveFilingDescription("some-unknown-filing", {}, ""),
      "Some Unknown Filing"
    );
  });
});
