import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "@/lib/auth";

describe("password hashing", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a user id", async () => {
    const token = await createSessionToken("user_123");
    expect(await verifySessionToken(token)).toBe("user_123");
  });
  it("rejects a tampered token", async () => {
    const token = await createSessionToken("user_123");
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifySessionToken(tampered)).toBeNull();
  });
  it("rejects garbage", async () => {
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });
});
