import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { isAuthorized } from "./origin-lock.ts";

function headers(init: Record<string, string> = {}) {
  const map = new Map(
    Object.entries(init).map(([k, v]) => [k.toLowerCase(), v])
  );
  return { get: (name: string) => map.get(name.toLowerCase()) ?? null };
}

describe("isAuthorized", () => {
  afterEach(() => {
    delete process.env.API_PROXY_SECRET;
    delete process.env.RAPIDAPI_PROXY_SECRET;
    delete process.env.API_ACCESS_KEY;
  });

  it("allows all traffic when no secrets are configured", () => {
    assert.equal(isAuthorized(headers()), true);
  });

  it("rejects missing RapidAPI proxy secret", () => {
    process.env.API_PROXY_SECRET = "s3cret";
    assert.equal(isAuthorized(headers()), false);
  });

  it("accepts a matching X-RapidAPI-Proxy-Secret", () => {
    process.env.API_PROXY_SECRET = "s3cret";
    assert.equal(
      isAuthorized(headers({ "x-rapidapi-proxy-secret": "s3cret" })),
      true
    );
  });

  it("rejects a wrong proxy secret", () => {
    process.env.API_PROXY_SECRET = "s3cret";
    assert.equal(
      isAuthorized(headers({ "x-rapidapi-proxy-secret": "wrong" })),
      false
    );
  });

  it("accepts X-Api-Key when API_ACCESS_KEY is set", () => {
    process.env.API_ACCESS_KEY = "zyla-key";
    assert.equal(isAuthorized(headers({ "x-api-key": "zyla-key" })), true);
  });

  it("accepts Bearer token when API_ACCESS_KEY is set", () => {
    process.env.API_ACCESS_KEY = "zyla-key";
    assert.equal(
      isAuthorized(headers({ authorization: "Bearer zyla-key" })),
      true
    );
  });
});
