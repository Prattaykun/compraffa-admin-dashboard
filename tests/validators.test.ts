import { describe, expect, it } from "vitest";
import { loginSchema, productSchema, signupSchema } from "@/lib/validators";

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    const parsed = signupSchema.safeParse({ name: "Ada Lovelace", email: "ada@example.com", password: "supersecret" });
    expect(parsed.success).toBe(true);
  });
  it("rejects a short password", () => {
    expect(signupSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "short" }).success).toBe(false);
  });
  it("rejects a bad email", () => {
    expect(signupSchema.safeParse({ name: "Ada", email: "not-an-email", password: "supersecret" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a password", () => {
    expect(loginSchema.safeParse({ email: "ada@example.com", password: "" }).success).toBe(false);
  });
});

describe("productSchema", () => {
  const valid = { name: "Test Product", sku: "TST-001", category: "Audio", price: 10, stock: 5, status: "active" };
  it("accepts a valid product and coerces numbers", () => {
    const parsed = productSchema.safeParse({ ...valid, price: "19.99", stock: "3" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.price).toBe(19.99);
      expect(parsed.data.stock).toBe(3);
    }
  });
  it("rejects negative stock", () => {
    expect(productSchema.safeParse({ ...valid, stock: -1 }).success).toBe(false);
  });
  it("rejects an unknown status", () => {
    expect(productSchema.safeParse({ ...valid, status: "weird" }).success).toBe(false);
  });
  it("rejects SKUs with spaces", () => {
    expect(productSchema.safeParse({ ...valid, sku: "BAD SKU" }).success).toBe(false);
  });
});
