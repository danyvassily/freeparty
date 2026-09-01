import { describe, expect, it } from "vitest";
import {
  MIN_ACCOUNT_PASSWORD_LENGTH,
  passwordRecoveryRedirect,
  validateNewPassword,
} from "../src/lib/auth/password";

describe("account password helpers", () => {
  it("rejects passwords shorter than the application minimum", () => {
    expect(validateNewPassword("a".repeat(MIN_ACCOUNT_PASSWORD_LENGTH - 1), "a".repeat(MIN_ACCOUNT_PASSWORD_LENGTH - 1))).toContain(
      String(MIN_ACCOUNT_PASSWORD_LENGTH),
    );
  });

  it("rejects a mismatching confirmation", () => {
    expect(validateNewPassword("nouveau-pass", "autre-pass")).toContain("correspondent");
  });

  it("accepts a valid confirmed password", () => {
    expect(validateNewPassword("nouveau-pass", "nouveau-pass")).toBeNull();
  });

  it("builds a stable recovery callback URL", () => {
    expect(passwordRecoveryRedirect("https://freeparty.example/")).toBe(
      "https://freeparty.example/auth/reset-password",
    );
  });
});
