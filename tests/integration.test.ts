import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/utils/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn(), debug: vi.fn(), child: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn(), debug: vi.fn() })) },
}));

vi.mock("axios", () => {
  const mockPost = vi.fn();
  const mockGet = vi.fn();
  return {
    default: { post: mockPost, get: mockGet },
    post: mockPost,
    get: mockGet,
  };
});

vi.mock("torosdk", () => {
  const mockSdk = {
    getBlockchainStatus: vi.fn(),
    getLatestBlockData: vi.fn(),
    getBlockById: vi.fn(),
    getTransaction: vi.fn(),
    getBalance: vi.fn(),
    getCurrencyBalance: vi.fn(),
    getTokenBalance: vi.fn(),
    getTokenName: vi.fn(),
    getTokenSymbol: vi.fn(),
    getTokenDecimal: vi.fn(),
    getAddr: vi.fn(),
    getName: vi.fn(),
    isNameUsed: vi.fn(),
    setName: vi.fn(),
    updateName: vi.fn(),
    deleteName: vi.fn(),
    transferCurrency: vi.fn(),
    makeInterWalletTransfer: vi.fn(),
    getSupportedAssetsExchangeRates: vi.fn(),
    getBridgeTokenFeeEstimate: vi.fn(),
    bridgeTokenFromChain: vi.fn(),
    getBridgeBalance: vi.fn(),
    recordProduct: vi.fn(),
    updateProduct: vi.fn(),
    getProduct: vi.fn(),
    deployContract: vi.fn(),
    registerContract: vi.fn(),
    isContractRegistered: vi.fn(),
    createWallet: vi.fn(),
    importWalletFromPrivateKeyAndPassword: vi.fn(),
    importKey: vi.fn(),
    verifyWalletPassword: vi.fn(),
    setupKYC: vi.fn(),
    performKYCForCustomer: vi.fn(),
    isAddressKYCVerified: vi.fn(),
    enrollAddress: vi.fn(),
    initializeSDK: vi.fn(),
    getSDKConfig: vi.fn(() => ({ getConfig: () => ({ network: "testnet" }) })),
  };
  return { ...mockSdk, default: mockSdk };
});

import { initializeToronetClient, getSDK } from "../src/sdk/client.js";
import { SdkError } from "../src/types/errors.js";

beforeEach(() => {
  vi.clearAllMocks();
  vi.isFakeDate?.();
  initializeToronetClient();
});

function mockSDK() {
  return getSDK();
}

describe("Wallet SDK", () => {
  it("creates wallet successfully", async () => {
    const sdk = mockSDK();
    (sdk.createWallet as ReturnType<typeof vi.fn>).mockResolvedValue("0xabc");
    const { createWallet } = await import("../src/sdk/wallet.js");
    const result = await createWallet("alice", "secret");
    expect(result.address).toBe("0xabc");
    expect(sdk.createWallet).toHaveBeenCalledWith({ username: "alice", password: "secret" });
  });

  it("throws SdkError on createWallet failure", async () => {
    const sdk = mockSDK();
    (sdk.createWallet as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("timeout"));
    const { createWallet } = await import("../src/sdk/wallet.js");
    await expect(createWallet("alice", "secret")).rejects.toThrow(SdkError);
  });

  it("imports wallet successfully", async () => {
    const sdk = mockSDK();
    (sdk.importWalletFromPrivateKeyAndPassword as ReturnType<typeof vi.fn>).mockResolvedValue("0xdef");
    const { importWallet } = await import("../src/sdk/wallet.js");
    const result = await importWallet({ privateKey: "pk", password: "pwd" });
    expect(result.address).toBe("0xdef");
  });

  it("throws ValidationError on import with missing fields", async () => {
    const { importWallet, ValidationError } = await import("../src/sdk/wallet.js");
    await expect(importWallet({ privateKey: "", password: "pwd" } as any)).rejects.toThrow(ValidationError);
  });

  it("verifies wallet password successfully", async () => {
    const sdk = mockSDK();
    (sdk.verifyWalletPassword as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const { verifyWalletPassword } = await import("../src/sdk/wallet.js");
    const result = await verifyWalletPassword("0xabc", "pwd");
    expect(result).toBe(true);
  });

  it("throws SdkError on verifyWalletPassword failure", async () => {
    const sdk = mockSDK();
    (sdk.verifyWalletPassword as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("auth failed"));
    const { verifyWalletPassword } = await import("../src/sdk/wallet.js");
    await expect(verifyWalletPassword("0xabc", "pwd")).rejects.toThrow(SdkError);
  });
});

describe("Blockchain SDK", () => {
  it("gets status successfully", async () => {
    const sdk = mockSDK();
    (sdk.getBlockchainStatus as ReturnType<typeof vi.fn>).mockResolvedValue({ blockCount: 42 });
    const { getBlockchainStatus } = await import("../src/sdk/blockchain.js");
    const result = await getBlockchainStatus();
    expect(result.blockCount).toBe(42);
  });

  it("throws SdkError on status failure", async () => {
    const sdk = mockSDK();
    (sdk.getBlockchainStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("node down"));
    const { getBlockchainStatus } = await import("../src/sdk/blockchain.js");
    await expect(getBlockchainStatus()).rejects.toThrow(SdkError);
  });

  it("gets latest block successfully", async () => {
    const sdk = mockSDK();
    (sdk.getLatestBlockData as ReturnType<typeof vi.fn>).mockResolvedValue({ hash: "0x123" });
    const { getLatestBlock } = await import("../src/sdk/blockchain.js");
    const result = await getLatestBlock();
    expect(result).toEqual({ hash: "0x123" });
  });

  it("gets transaction successfully", async () => {
    const sdk = mockSDK();
    (sdk.getTransaction as ReturnType<typeof vi.fn>).mockResolvedValue({ txHash: "0xtx" });
    const { getTransaction } = await import("../src/sdk/blockchain.js");
    const result = await getTransaction("0xtx");
    expect(result).toEqual({ txHash: "0xtx" });
  });
});

describe("Balance SDK", () => {
  it("gets balance successfully", async () => {
    const sdk = mockSDK();
    (sdk.getBalance as ReturnType<typeof vi.fn>).mockResolvedValue({ ngnBalance: "1000" });
    const { getBalance } = await import("../src/sdk/balance.js");
    const result = await getBalance("0xabc");
    expect(result.ngnBalance).toBe("1000");
  });

  it("gets token info (silent degrade on failure)", async () => {
    const sdk = mockSDK();
    (sdk.getTokenName as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("no network"));
    const { getTokenInfo } = await import("../src/sdk/balance.js");
    const result = await getTokenInfo("0xcontract");
    expect(result).toBeNull();
  });

  it("gets currency balance successfully", async () => {
    const sdk = mockSDK();
    (sdk.getCurrencyBalance as ReturnType<typeof vi.fn>).mockResolvedValue({ balance: "500" });
    const { getCurrencyBalance } = await import("../src/sdk/balance.js");
    const result = await getCurrencyBalance("0xabc", "USD");
    expect(result).toEqual({ balance: "500" });
  });

  it("throws SdkError on getBalance failure", async () => {
    const sdk = mockSDK();
    (sdk.getBalance as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("timeout"));
    const { getBalance } = await import("../src/sdk/balance.js");
    await expect(getBalance("0xabc")).rejects.toThrow(SdkError);
  });
});

describe("TNS SDK", () => {
  it("resolves name to address successfully", async () => {
    const sdk = mockSDK();
    (sdk.getAddr as ReturnType<typeof vi.fn>).mockResolvedValue({ address: "0xabc" });
    const { resolveName } = await import("../src/sdk/tns.js");
    const result = await resolveName("alice.toro");
    expect(result).toBe("0xabc");
  });

  it("resolves name returns null on failure (silent degrade)", async () => {
    const sdk = mockSDK();
    (sdk.getAddr as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("no network"));
    const { resolveName } = await import("../src/sdk/tns.js");
    const result = await resolveName("alice.toro");
    expect(result).toBeNull();
  });

  it("resolves address to name successfully", async () => {
    const sdk = mockSDK();
    (sdk.getName as ReturnType<typeof vi.fn>).mockResolvedValue("alice.toro");
    const { resolveAddress } = await import("../src/sdk/tns.js");
    const result = await resolveAddress("0xabc");
    expect(result).toBe("alice.toro");
  });

  it("checks name availability", async () => {
    const sdk = mockSDK();
    (sdk.isNameUsed as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const { isNameAvailable } = await import("../src/sdk/tns.js");
    const result = await isNameAvailable("alice.toro");
    expect(result).toBe(true);
  });

  it("throws SdkError on setName failure", async () => {
    const sdk = mockSDK();
    (sdk.setName as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("name taken"));
    const { setName } = await import("../src/sdk/tns.js");
    await expect(setName("0xabc", "alice", "pwd")).rejects.toThrow(SdkError);
  });

  it("updates and deletes names successfully", async () => {
    const sdk = mockSDK();
    (sdk.updateName as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (sdk.deleteName as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { updateName, deleteName } = await import("../src/sdk/tns.js");
    expect(await updateName("0xabc", "old", "new", "pwd")).toBe(true);
    expect(await deleteName("0xabc", "pwd")).toBe(true);
  });
});

describe("KYC SDK", () => {
  const kycParams = {
    firstName: "John",
    middleName: "",
    lastName: "Doe",
    bvn: "1234567890",
    currency: "NGN",
    phoneNumber: "+2348000000000",
    dob: "1990-01-01",
    address: "0xabc",
    admin: "0xadmin",
    adminpwd: "adminpass",
  };

  it("sets up KYC successfully", async () => {
    const sdk = mockSDK();
    (sdk.setupKYC as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const { setupKYC } = await import("../src/sdk/kyc.js");
    expect(await setupKYC(kycParams)).toBe(true);
  });

  it("performs KYC successfully", async () => {
    const sdk = mockSDK();
    (sdk.performKYCForCustomer as ReturnType<typeof vi.fn>).mockResolvedValue({ verified: true });
    const { performKYC } = await import("../src/sdk/kyc.js");
    const result = await performKYC(kycParams);
    expect(result.verified).toBe(true);
  });

  it("checks KYC status successfully", async () => {
    const sdk = mockSDK();
    (sdk.isAddressKYCVerified as ReturnType<typeof vi.fn>).mockResolvedValue({ verified: true });
    const { checkKYC } = await import("../src/sdk/kyc.js");
    const result = await checkKYC("0xabc");
    expect(result.verified).toBe(true);
  });

  it("throws SdkError on performKYC failure", async () => {
    const sdk = mockSDK();
    (sdk.performKYCForCustomer as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("KYC failed"));
    const { performKYC } = await import("../src/sdk/kyc.js");
    await expect(performKYC(kycParams)).rejects.toThrow(SdkError);
  });

  it("enrolls address successfully", async () => {
    const sdk = mockSDK();
    (sdk.enrollAddress as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const { enrollAddress } = await import("../src/sdk/kyc.js");
    expect(await enrollAddress({ currency: "NGN", address: "0xabc", admin: "0xadmin", adminpwd: "pwd", targetAddress: "0xtarget" })).toBe(true);
  });
});

describe("Currency SDK", () => {
  it("transfers currency successfully", async () => {
    const sdk = mockSDK();
    (sdk.transferCurrency as ReturnType<typeof vi.fn>).mockResolvedValue({ txHash: "0xtx" });
    const { transferCurrency } = await import("../src/sdk/currency.js");
    const result = await transferCurrency({ currency: "NGN", senderAddr: "0xa", senderPwd: "pwd", receiverAddr: "0xb", amount: "100" });
    expect(result.success).toBe(true);
    expect(result.txHash).toBe("0xtx");
  });

  it("throws ValidationError on transfer with missing fields", async () => {
    const { transferCurrency, ValidationError } = await import("../src/sdk/currency.js");
    await expect(transferCurrency({} as any)).rejects.toThrow(ValidationError);
  });

  it("throws SdkError on transfer failure", async () => {
    const sdk = mockSDK();
    (sdk.transferCurrency as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("insufficient funds"));
    const { transferCurrency } = await import("../src/sdk/currency.js");
    await expect(transferCurrency({ currency: "NGN", senderAddr: "0xa", senderPwd: "pwd", receiverAddr: "0xb", amount: "100" })).rejects.toThrow(SdkError);
  });

  it("makes inter-wallet transfer successfully", async () => {
    const sdk = mockSDK();
    (sdk.makeInterWalletTransfer as ReturnType<typeof vi.fn>).mockResolvedValue({ txid: "0xtx" });
    const { makeInterWalletTransfer } = await import("../src/sdk/currency.js");
    const result = await makeInterWalletTransfer("0xa", "pwd", "0xb", "50", "TORO");
    expect(result.success).toBe(true);
  });

  it("returns supported currencies list", async () => {
    const { getSupportedCurrencies } = await import("../src/sdk/currency.js");
    const list = getSupportedCurrencies();
    expect(list).toContain("TORO");
    expect(list).toContain("USD");
    expect(list).toContain("NGN");
  });

  it("gets exchange rates successfully", async () => {
    const sdk = mockSDK();
    (sdk.getSupportedAssetsExchangeRates as ReturnType<typeof vi.fn>).mockResolvedValue({ TORO_USD: 0.5 });
    const { getExchangeRates } = await import("../src/sdk/currency.js");
    const rates = await getExchangeRates();
    expect(rates.TORO_USD).toBe(0.5);
  });

  const VALID_PK = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  const VALID_ADDR = "0x1234567890abcdef1234567890abcdef12345678";
  const VALID_ADDR2 = "0xabcdef1234567890abcdef1234567890abcdef12";

  it("imports wallet key successfully (custodial keystore)", async () => {
    const axios = await import("axios");
    (axios.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { result: true, address: VALID_ADDR },
    });
    const { importWalletKey } = await import("../src/sdk/currency.js");
    const result = await importWalletKey({ privateKey: VALID_PK, password: "pwd" });
    expect(result.success).toBe(true);
    expect(result.address).toBe(VALID_ADDR);
    expect(result.message).toBe("key imported");
  });

  it("throws ValidationError on importWalletKey missing privateKey", async () => {
    const { importWalletKey, ValidationError } = await import("../src/sdk/currency.js");
    await expect(importWalletKey({ privateKey: "", password: "pwd" } as any)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError on importWalletKey missing password", async () => {
    const { importWalletKey, ValidationError } = await import("../src/sdk/currency.js");
    await expect(importWalletKey({ privateKey: VALID_PK, password: "" } as any)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError on importWalletKey invalid private key format", async () => {
    const { importWalletKey, ValidationError } = await import("../src/sdk/currency.js");
    await expect(importWalletKey({ privateKey: "invalid", password: "pwd" })).rejects.toThrow(ValidationError);
  });

  it("throws SdkError on importWalletKey upstream failure", async () => {
    const axios = await import("axios");
    (axios.default.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network error"));
    const { importWalletKey, SdkError } = await import("../src/sdk/currency.js");
    await expect(importWalletKey({ privateKey: VALID_PK, password: "pwd" })).rejects.toThrow(SdkError);
  });

  it("throws SdkError on importWalletKey malformed response", async () => {
    const axios = await import("axios");
    (axios.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
    });
    const { importWalletKey, SdkError } = await import("../src/sdk/currency.js");
    await expect(importWalletKey({ privateKey: VALID_PK, password: "pwd" })).rejects.toThrow(SdkError);
  });

  it("importWalletKey returns success for duplicate key (non-error)", async () => {
    const axios = await import("axios");
    (axios.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { result: false, error: "duplicate key", address: VALID_ADDR },
    });
    const { importWalletKey } = await import("../src/sdk/currency.js");
    const result = await importWalletKey({ privateKey: VALID_PK, password: "pwd" });
    expect(result.success).toBe(true);
    expect(result.message).toContain("duplicate");
  });

  it("transfers TORO successfully (custodial POST)", async () => {
    const axios = await import("axios");
    (axios.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { result: true },
    });
    const { transferToro } = await import("../src/sdk/currency.js");
    const result = await transferToro({
      senderAddr: VALID_ADDR,
      senderPwd: "pwd",
      receiverAddr: VALID_ADDR2,
      amount: "1",
    });
    expect(result.success).toBe(true);
    expect(result.sender).toBe(VALID_ADDR);
    expect(result.receiver).toBe(VALID_ADDR2);
    expect(result.amount).toBe("1");
  });

  it("throws ValidationError on transferToro missing fields", async () => {
    const { transferToro, ValidationError } = await import("../src/sdk/currency.js");
    await expect(transferToro({} as any)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError on transferToro invalid sender address", async () => {
    const { transferToro, ValidationError } = await import("../src/sdk/currency.js");
    await expect(transferToro({ senderAddr: "not-an-address", senderPwd: "pwd", receiverAddr: VALID_ADDR2, amount: "1" })).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError on transferToro invalid recipient address", async () => {
    const { transferToro, ValidationError } = await import("../src/sdk/currency.js");
    await expect(transferToro({ senderAddr: VALID_ADDR, senderPwd: "pwd", receiverAddr: "short", amount: "1" })).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError on transferToro non-positive amount", async () => {
    const { transferToro, ValidationError } = await import("../src/sdk/currency.js");
    await expect(transferToro({ senderAddr: VALID_ADDR, senderPwd: "pwd", receiverAddr: VALID_ADDR2, amount: "0" })).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError on transferToro negative amount", async () => {
    const { transferToro, ValidationError } = await import("../src/sdk/currency.js");
    await expect(transferToro({ senderAddr: VALID_ADDR, senderPwd: "pwd", receiverAddr: VALID_ADDR2, amount: "-5" })).rejects.toThrow(ValidationError);
  });

  it("throws SdkError on transferToro API failure (insufficient balance)", async () => {
    const axios = await import("axios");
    (axios.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { result: false, error: "insufficient balance" },
    });
    const { transferToro, SdkError } = await import("../src/sdk/currency.js");
    await expect(
      transferToro({ senderAddr: VALID_ADDR, senderPwd: "pwd", receiverAddr: VALID_ADDR2, amount: "999" }),
    ).rejects.toThrow(SdkError);
  });

  it("throws SdkError on transferToro upstream 4xx/5xx", async () => {
    const axios = await import("axios");
    (axios.default.post as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Request failed with status code 500"));
    const { transferToro, SdkError } = await import("../src/sdk/currency.js");
    await expect(
      transferToro({ senderAddr: VALID_ADDR, senderPwd: "pwd", receiverAddr: VALID_ADDR2, amount: "1" }),
    ).rejects.toThrow(SdkError);
  });

  it("throws SdkError on transferToro malformed upstream response", async () => {
    const axios = await import("axios");
    (axios.default.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
    });
    const { transferToro, SdkError } = await import("../src/sdk/currency.js");
    await expect(
      transferToro({ senderAddr: VALID_ADDR, senderPwd: "pwd", receiverAddr: VALID_ADDR2, amount: "1" }),
    ).rejects.toThrow(SdkError);
  });
});

describe("Bridge SDK", () => {
  it("gets bridge fee successfully", async () => {
    const sdk = mockSDK();
    (sdk.getBridgeTokenFeeEstimate as ReturnType<typeof vi.fn>).mockResolvedValue({ fee: "0.01" });
    const { getBridgeFee } = await import("../src/sdk/bridge.js");
    const result = await getBridgeFee("solana", "0xcontract", "100");
    expect(result.fee).toBe("0.01");
    expect(result.chain).toBe("solana");
  });

  it("throws ValidationError on unsupported chain", async () => {
    const { getBridgeFee, ValidationError } = await import("../src/sdk/bridge.js");
    await expect(getBridgeFee("ethereum" as any, "0x", "100")).rejects.toThrow(ValidationError);
  });

  it("bridges token successfully", async () => {
    const sdk = mockSDK();
    (sdk.bridgeTokenFromChain as ReturnType<typeof vi.fn>).mockResolvedValue({ txHash: "0xbridge" });
    const { bridgeToken } = await import("../src/sdk/bridge.js");
    const result = await bridgeToken("polygon", { from: "0xa", pwd: "pwd", contractaddress: "0xc", tokenname: "TKN", amount: "50" });
    expect(result).toEqual({ txHash: "0xbridge" });
  });

  it("gets bridge balance successfully", async () => {
    const sdk = mockSDK();
    (sdk.getBridgeBalance as ReturnType<typeof vi.fn>).mockResolvedValue({ balance: "200" });
    const { getBridgeBalance } = await import("../src/sdk/bridge.js");
    const result = await getBridgeBalance("0xabc");
    expect(result).toEqual({ balance: "200" });
  });
});

describe("Products SDK", () => {
  it("records product successfully", async () => {
    const sdk = mockSDK();
    (sdk.recordProduct as ReturnType<typeof vi.fn>).mockResolvedValue({ productId: "p1" });
    const { recordProduct } = await import("../src/sdk/products.js");
    const result = await recordProduct({ productId: "p1", productName: "Widget", description: "A widget", productImage: "", admin: "0xadmin", adminpwd: "pwd" });
    expect(result).toEqual({ productId: "p1" });
  });

  it("throws ValidationError on record without name", async () => {
    const { recordProduct, ValidationError } = await import("../src/sdk/products.js");
    await expect(recordProduct({} as any)).rejects.toThrow(ValidationError);
  });

  it("updates product successfully", async () => {
    const sdk = mockSDK();
    (sdk.updateProduct as ReturnType<typeof vi.fn>).mockResolvedValue({ productId: "p1" });
    const { updateProduct } = await import("../src/sdk/products.js");
    const result = await updateProduct({ productId: "p1", productName: "Updated", description: "", productImage: "", admin: "", adminpwd: "" });
    expect(result).toEqual({ productId: "p1" });
  });

  it("gets product successfully", async () => {
    const sdk = mockSDK();
    (sdk.getProduct as ReturnType<typeof vi.fn>).mockResolvedValue({ productName: "Widget" });
    const { getProduct } = await import("../src/sdk/products.js");
    const result = await getProduct({ productId: "p1", admin: "admin", adminpwd: "pwd" });
    expect(result).toEqual({ productName: "Widget" });
  });

  it("returns null on getProduct failure (silent degrade)", async () => {
    const sdk = mockSDK();
    (sdk.getProduct as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("not found"));
    const { getProduct } = await import("../src/sdk/products.js");
    const result = await getProduct({ productId: "p1", admin: "admin", adminpwd: "pwd" });
    expect(result).toBeNull();
  });
});

describe("Deployer SDK", () => {
  it("deploys contract successfully", async () => {
    const sdk = mockSDK();
    (sdk.deployContract as ReturnType<typeof vi.fn>).mockResolvedValue({ address: "0xcontract" });
    const { deployContract } = await import("../src/sdk/deployer.js");
    const result = await deployContract({ owner: "0xa", constructorArgs: [], abi: [], bytecode: "0x6080" });
    expect(result.address).toBe("0xcontract");
  });

  it("throws ValidationError on deploy without bytecode", async () => {
    const { deployContract, ValidationError } = await import("../src/sdk/deployer.js");
    await expect(deployContract({} as any)).rejects.toThrow(ValidationError);
  });

  it("registers contract successfully", async () => {
    const sdk = mockSDK();
    (sdk.registerContract as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const { registerContract } = await import("../src/sdk/deployer.js");
    expect(await registerContract({ address: "0xa", password: "pwd", contract: "0xc" })).toBe(true);
  });

  it("checks contract registration (silent degrade on failure)", async () => {
    const sdk = mockSDK();
    (sdk.isContractRegistered as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("no network"));
    const { isContractRegistered } = await import("../src/sdk/deployer.js");
    expect(await isContractRegistered("0xc")).toBe(false);
  });

  it("checks contract registration (success)", async () => {
    const sdk = mockSDK();
    (sdk.isContractRegistered as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const { isContractRegistered } = await import("../src/sdk/deployer.js");
    expect(await isContractRegistered("0xc")).toBe(true);
  });
});
