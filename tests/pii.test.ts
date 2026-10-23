import { describe, expect, it } from "vitest";
import { luhnValid, maskPii } from "@/lib/guards/pii";

describe("luhnValid", () => {
  it("accepts a valid test card number and rejects an invalid one", () => {
    expect(luhnValid("4111111111111111")).toBe(true);
    expect(luhnValid("4111111111111112")).toBe(false);
  });
});

describe("maskPii", () => {
  it("masks a spaced card number, keeping the last four digits", () => {
    const r = maskPii("customer card 4111 1111 1111 1111 declined");
    expect(r.text).toBe("customer card XXXX XXXX XXXX 1111 declined");
    expect(r.findings).toContain("card number");
  });

  it("masks dashed card numbers", () => {
    expect(maskPii("5555-5555-5555-4444").text).toBe("XXXX XXXX XXXX 4444");
  });

  it("leaves long numbers that fail the Luhn check, such as order ids", () => {
    const r = maskPii("order 1234567890123456 failed");
    expect(r.text).toBe("order 1234567890123456 failed");
    expect(r.findings).toEqual([]);
  });

  it("masks OTPs and CVVs", () => {
    const r = maskPii("my otp is 482913 and cvv 123");
    expect(r.text).not.toContain("482913");
    expect(r.text).not.toContain("123");
    expect(r.findings).toEqual(expect.arrayContaining(["OTP", "CVV"]));
  });

  it("does not touch ordinary status codes", () => {
    expect(maskPii("getting HTTP 504 and RC 91").text).toBe("getting HTTP 504 and RC 91");
  });
});
