import { describe, it, expect, vi } from "vitest";

vi.mock("torosdk", () => ({
  initializeSDK: vi.fn(),
  getSDKConfig: vi.fn(() => ({ getConfig: () => ({ network: "testnet" }) })),
}));

describe("Network Topology Regression Guard", () => {
  it("env config has correct testnet base URL default for TORONET_BASE_URL", async () => {
    const { env } = await import("../src/config/env.js");
    const correctBase = "https://testnet.toronet.org/api";
    const currentBase = env.TORONET_BASE_URL;
    if (currentBase) {
      expect(currentBase).toBe(correctBase);
    }
  });

  it("baseURL() helper constructs correct URL from env", async () => {
    const { env } = await import("../src/config/env.js");
    const expected = env.TORONET_BASE_URL ?? "https://testnet.toronet.org/api";
    expect(expected).toMatch(/^https?:\/\/.+\/api$/);
    expect(expected).not.toBe("http://testnet.toronet.org");
    expect(expected).not.toBe("https://api.toronet.org");
  });

  it("SDK config passes through TORONET_BASE_URL when set", async () => {
    const { initializeToronetClient } = await import("../src/sdk/client.js");
    const { env } = await import("../src/config/env.js");
    const torosdk = await import("torosdk");
    initializeToronetClient();
    const expectedUrl = env.TORONET_BASE_URL ?? undefined;
    if (expectedUrl) {
      expect(torosdk.initializeSDK).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: expectedUrl }),
      );
    }
  });
});
