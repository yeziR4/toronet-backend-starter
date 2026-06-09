import { describe, it, expect } from "vitest";
import { ValidationError } from "../src/types/errors.js";

describe("Wallet Module (unit)", () => {
  it("importWallet throws on missing privateKey or password", async () => {
    const wallet = await import("../src/sdk/wallet.js");
    await expect(
      wallet.importWallet({ privateKey: "", password: "pass" }),
    ).rejects.toThrow(ValidationError);

    await expect(
      wallet.importWallet({ privateKey: "key", password: "" }),
    ).rejects.toThrow(ValidationError);
  });

  it("verifyWalletPassword throws on unknown address", async () => {
    const wallet = await import("../src/sdk/wallet.js");
    await expect(
      wallet.verifyWalletPassword(
        "0x0000000000000000000000000000000000000000",
        "pass",
      ),
    ).rejects.toThrow();
  });

  it("importKey propagates SDK errors", async () => {
    const wallet = await import("../src/sdk/wallet.js");
    await expect(wallet.importKey("", "")).rejects.toThrow();
  });
});

describe("Error types", () => {
  it("SdkError has correct shape", async () => {
    const { SdkError } = await import("../src/types/errors.js");
    const err = new SdkError("testOp", "failure detail");
    expect(err.message).toBe("SDK operation failed: testOp — failure detail");
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe("SDK_ERROR");
    expect(err.name).toBe("SdkError");
  });

  it("NotFoundError has correct shape", async () => {
    const { NotFoundError } = await import("../src/types/errors.js");
    const err = new NotFoundError("Wallet", "0xabc");
    expect(err.message).toBe("Wallet not found: 0xabc");
    expect(err.statusCode).toBe(404);
  });

  it("ValidationError has correct shape", async () => {
    const { ValidationError } = await import("../src/types/errors.js");
    const err = new ValidationError("bad input");
    expect(err.message).toBe("bad input");
    expect(err.statusCode).toBe(400);
  });
});

describe("Response helpers", () => {
  it("sendSuccess/sendError are functions", async () => {
    const resp = await import("../src/utils/response.js");
    expect(typeof resp.sendSuccess).toBe("function");
    expect(typeof resp.sendError).toBe("function");
  });
});
