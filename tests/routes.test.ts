import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

vi.mock("torosdk", () => {
  const mockSdk = {
    initializeSDK: vi.fn(),
    getSDKConfig: vi.fn(() => ({ getConfig: () => ({ network: "testnet" }) })),
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
  };
  return { ...mockSdk, default: mockSdk };
});

import { initializeToronetClient, getSDK } from "../src/sdk/client.js";
import supertest from "supertest";

let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  initializeToronetClient();
  const { app } = await import("../src/index.js");
  request = supertest(app);
});

afterAll(() => {
  vi.clearAllMocks();
});

function mockSDK() {
  return getSDK();
}

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request.get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /", () => {
  it("returns 200 with service metadata", async () => {
    const res = await request.get("/");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("toronet-backend-starter");
    expect(res.body.endpoints).toBeInstanceOf(Array);
  });
});

describe("Wallet routes", () => {
  it("POST /api/wallet/create — success", async () => {
    const sdk = mockSDK();
    (sdk.createWallet as ReturnType<typeof vi.fn>).mockResolvedValue("0xabc");
    const res = await request
      .post("/api/wallet/create")
      .send({ username: "alice", password: "secret" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.address).toBe("0xabc");
  });

  it("POST /api/wallet/create — 400 on missing password", async () => {
    const res = await request
      .post("/api/wallet/create")
      .send({ username: "alice" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/wallet/import — 400 on missing fields", async () => {
    const res = await request
      .post("/api/wallet/import")
      .send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/wallet/import-key — success", async () => {
    const sdk = mockSDK();
    (sdk.importKey as ReturnType<typeof vi.fn>).mockResolvedValue("0xkey");
    const res = await request
      .post("/api/wallet/import-key")
      .send({ privateKey: "pk", password: "pwd" });
    expect(res.status).toBe(200);
    expect(res.body.data.address).toBe("0xkey");
  });
});

describe("Blockchain routes", () => {
  it("GET /api/blockchain/status — success", async () => {
    const sdk = mockSDK();
    (sdk.getBlockchainStatus as ReturnType<typeof vi.fn>).mockResolvedValue({ blockCount: 42 });
    const res = await request.get("/api/blockchain/status");
    expect(res.status).toBe(200);
    expect(res.body.data.blockCount).toBe(42);
  });

  it("GET /api/blockchain/status — 502 on SDK error", async () => {
    const sdk = mockSDK();
    (sdk.getBlockchainStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("node down"));
    const res = await request.get("/api/blockchain/status");
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("SDK_ERROR");
  });

  it("GET /api/blockchain/latest-block — success", async () => {
    const sdk = mockSDK();
    (sdk.getLatestBlockData as ReturnType<typeof vi.fn>).mockResolvedValue({ hash: "0x123" });
    const res = await request.get("/api/blockchain/latest-block");
    expect(res.status).toBe(200);
    expect(res.body.data.hash).toBe("0x123");
  });

  it("GET /api/blockchain/blocks/:blockId — success", async () => {
    const sdk = mockSDK();
    (sdk.getBlockById as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "0x1" });
    const res = await request.get("/api/blockchain/blocks/0x1");
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("0x1");
  });

  it("GET /api/blockchain/transactions/:txId — 502 on SDK error", async () => {
    const sdk = mockSDK();
    (sdk.getTransaction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("tx not found"));
    const res = await request.get("/api/blockchain/transactions/0xtx");
    expect(res.status).toBe(502);
  });
});

describe("Balance routes", () => {
  it("GET /api/balance/:address — success", async () => {
    const sdk = mockSDK();
    (sdk.getBalance as ReturnType<typeof vi.fn>).mockResolvedValue({ ngnBalance: "1000" });
    const res = await request.get("/api/balance/0xabc");
    expect(res.status).toBe(200);
    expect(res.body.data.ngnBalance).toBe("1000");
  });

  it("GET /api/balance/:address/currency/:currency — success", async () => {
    const sdk = mockSDK();
    (sdk.getCurrencyBalance as ReturnType<typeof vi.fn>).mockResolvedValue({ balance: "500" });
    const res = await request.get("/api/balance/0xabc/currency/USD");
    expect(res.status).toBe(200);
    expect(res.body.data.balance).toBe("500");
  });
});

describe("TNS routes", () => {
  it("GET /api/tns/resolve/name/:name — success", async () => {
    const sdk = mockSDK();
    (sdk.getAddr as ReturnType<typeof vi.fn>).mockResolvedValue({ address: "0xabc" });
    const res = await request.get("/api/tns/resolve/name/alice.toro");
    expect(res.status).toBe(200);
    expect(res.body.data.address).toBe("0xabc");
  });

  it("GET /api/tns/available/:name — success", async () => {
    const sdk = mockSDK();
    (sdk.isNameUsed as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const res = await request.get("/api/tns/available/alice.toro");
    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(true);
  });

  it("POST /api/tns/register — success", async () => {
    const sdk = mockSDK();
    (sdk.setName as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    const res = await request
      .post("/api/tns/register")
      .send({ address: "0xabc", name: "alice", password: "pwd" });
    expect(res.status).toBe(201);
    expect(res.body.data.registered).toBe(true);
  });
});

describe("KYC routes", () => {
  it("GET /api/kyc/status/:address — success", async () => {
    const sdk = mockSDK();
    (sdk.isAddressKYCVerified as ReturnType<typeof vi.fn>).mockResolvedValue({ verified: true });
    const res = await request.get("/api/kyc/status/0xabc");
    expect(res.status).toBe(200);
    expect(res.body.data.verified).toBe(true);
  });

  it("POST /api/kyc/setup — 400 on missing admin", async () => {
    const res = await request
      .post("/api/kyc/setup")
      .send({ address: "0xabc" });
    expect(res.status).toBe(400);
  });
});

describe("Currency routes", () => {
  it("GET /api/currency/supported — success", async () => {
    const res = await request.get("/api/currency/supported");
    expect(res.status).toBe(200);
    expect(res.body.data.currencies).toContain("TORO");
  });

  it("GET /api/currency/rates — 502 on SDK error", async () => {
    const sdk = mockSDK();
    (sdk.getSupportedAssetsExchangeRates as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("rates down"));
    const res = await request.get("/api/currency/rates");
    expect(res.status).toBe(502);
  });

  it("POST /api/currency/transfer — 400 on missing fields", async () => {
    const res = await request
      .post("/api/currency/transfer")
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("Bridge routes", () => {
  it("GET /api/bridge/fees/:chain — success", async () => {
    const sdk = mockSDK();
    (sdk.getBridgeTokenFeeEstimate as ReturnType<typeof vi.fn>).mockResolvedValue({ fee: "0.01" });
    const res = await request
      .get("/api/bridge/fees/solana?contractAddress=0xc&amount=100");
    expect(res.status).toBe(200);
    expect(res.body.data.fee).toBe("0.01");
  });

  it("GET /api/bridge/balance/:address — 502 on SDK error", async () => {
    const sdk = mockSDK();
    (sdk.getBridgeBalance as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("bridge down"));
    const res = await request.get("/api/bridge/balance/0xabc");
    expect(res.status).toBe(502);
  });
});

describe("Products routes", () => {
  it("POST /api/products — success", async () => {
    const sdk = mockSDK();
    (sdk.recordProduct as ReturnType<typeof vi.fn>).mockResolvedValue({ productId: "p1" });
    const res = await request
      .post("/api/products")
      .send({ productName: "Widget" });
    expect(res.status).toBe(201);
    expect(res.body.data.productId).toBe("p1");
  });

  it("POST /api/products — 400 on missing productName", async () => {
    const res = await request
      .post("/api/products")
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("Deployer routes", () => {
  it("POST /api/deployer/deploy — success", async () => {
    const sdk = mockSDK();
    (sdk.deployContract as ReturnType<typeof vi.fn>).mockResolvedValue({ address: "0xcontract" });
    const res = await request
      .post("/api/deployer/deploy")
      .send({ bytecode: "0x6080" });
    expect(res.status).toBe(201);
    expect(res.body.data.address).toBe("0xcontract");
  });

  it("POST /api/deployer/deploy — 400 on missing bytecode", async () => {
    const res = await request
      .post("/api/deployer/deploy")
      .send({});
    expect(res.status).toBe(400);
  });

  it("GET /api/deployer/check/:contract — success", async () => {
    const sdk = mockSDK();
    (sdk.isContractRegistered as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const res = await request.get("/api/deployer/check/0xc");
    expect(res.status).toBe(200);
    expect(res.body.data.registered).toBe(true);
  });
});
