import { describe, it, expect } from "vitest";

describe("SDK Integration Layer", () => {
  it("loads torosdk module", async () => {
    const sdk = await import("torosdk");
    expect(sdk).toBeDefined();
    expect(typeof sdk.initializeSDK).toBe("function");
  });

  it("exports expected SDK functions", async () => {
    const sdk = await import("torosdk");
    const expectedFns = [
      "initializeSDK",
      "getSDKConfig",
      "createWallet",
      "getBlockchainStatus",
      "getBalance",
      "getName",
      "getAddr",
    ];
    for (const fn of expectedFns) {
      expect(typeof sdk[fn as keyof typeof sdk]).toBe("function");
    }
  });

  it("validates env configuration shape", async () => {
    const { env } = await import("../src/config/env.js");
    expect(env).toBeDefined();
    expect(["testnet", "mainnet"]).toContain(env.TORONET_NETWORK);
    expect(env.PORT).toBeGreaterThan(0);
  });

  it("exports typed error classes", async () => {
    const { ToronetError, NotFoundError, SdkError, ValidationError } =
      await import("../src/types/errors.js");

    const sdkErr = new SdkError("test", "detail");
    expect(sdkErr).toBeInstanceOf(ToronetError);
    expect(sdkErr.statusCode).toBe(502);
    expect(sdkErr.code).toBe("SDK_ERROR");

    const notFound = new NotFoundError("Wallet", "0xabc");
    expect(notFound.statusCode).toBe(404);
    expect(notFound.code).toBe("NOT_FOUND");

    const valErr = new ValidationError("bad input");
    expect(valErr.statusCode).toBe(400);
    expect(valErr.code).toBe("VALIDATION_ERROR");
  });

  it("wallet module exports expected async functions", async () => {
    const wallet = await import("../src/sdk/wallet.js");
    expect(typeof wallet.createWallet).toBe("function"); // async
    expect(typeof wallet.importWallet).toBe("function");
    expect(typeof wallet.verifyWalletPassword).toBe("function");
  });

  it("blockchain module exports expected async functions", async () => {
    const bc = await import("../src/sdk/blockchain.js");
    expect(typeof bc.getBlockchainStatus).toBe("function");
    expect(typeof bc.getLatestBlock).toBe("function");
    expect(typeof bc.getBlockById).toBe("function");
    expect(typeof bc.getTransaction).toBe("function");
  });

  it("balance module exports expected async functions", async () => {
    const bal = await import("../src/sdk/balance.js");
    expect(typeof bal.getBalance).toBe("function");
    expect(typeof bal.getCurrencyBalance).toBe("function");
    expect(typeof bal.getTokenBalance).toBe("function");
    expect(typeof bal.getTokenInfo).toBe("function");
  });

  it("TNS module exports expected async functions", async () => {
    const tns = await import("../src/sdk/tns.js");
    expect(typeof tns.resolveName).toBe("function");
    expect(typeof tns.resolveAddress).toBe("function");
    expect(typeof tns.isNameAvailable).toBe("function");
    expect(typeof tns.setName).toBe("function");
    expect(typeof tns.updateName).toBe("function");
    expect(typeof tns.deleteName).toBe("function");
  });

  it("KYC module exports expected async functions", async () => {
    const kyc = await import("../src/sdk/kyc.js");
    expect(typeof kyc.setupKYC).toBe("function");
    expect(typeof kyc.performKYC).toBe("function");
    expect(typeof kyc.checkKYC).toBe("function");
    expect(typeof kyc.enrollAddress).toBe("function");
  });

  it("currency module exports expected async functions", async () => {
    const curr = await import("../src/sdk/currency.js");
    expect(typeof curr.transferCurrency).toBe("function");
    expect(typeof curr.makeInterWalletTransfer).toBe("function");
    expect(typeof curr.getSupportedCurrencies).toBe("function");
    expect(typeof curr.getExchangeRates).toBe("function");
  });

  it("bridge module exports expected async functions", async () => {
    const bridge = await import("../src/sdk/bridge.js");
    expect(typeof bridge.getBridgeFee).toBe("function");
    expect(typeof bridge.bridgeToken).toBe("function");
    expect(typeof bridge.getBridgeBalance).toBe("function");
  });

  it("products module exports expected async functions", async () => {
    const prod = await import("../src/sdk/products.js");
    expect(typeof prod.recordProduct).toBe("function");
    expect(typeof prod.updateProduct).toBe("function");
    expect(typeof prod.getProduct).toBe("function");
  });

  it("deployer module exports expected async functions", async () => {
    const dep = await import("../src/sdk/deployer.js");
    expect(typeof dep.deployContract).toBe("function");
    expect(typeof dep.registerContract).toBe("function");
    expect(typeof dep.isContractRegistered).toBe("function");
  });
});
