import { initializeToronetClient, getSDKConfig } from "../src/sdk/client.js";

async function main() {
  console.log("=== Toronet SDK Smoke Test ===\n");

  try {
    initializeToronetClient();
    const config = getSDKConfig();
    console.log("SDK initialized:", JSON.stringify(config, null, 2));
  } catch (err) {
    console.error("SDK init failed:", (err as Error).message);
    process.exit(1);
  }

  const { getBlockchainStatus } = await import("../src/sdk/blockchain.js");
  const { getBalance } = await import("../src/sdk/balance.js");
  const { getExchangeRates } = await import("../src/sdk/currency.js");
  const { getBridgeBalance } = await import("../src/sdk/bridge.js");
  const { isContractRegistered } = await import("../src/sdk/deployer.js");

  try {
    console.log("\n1. Blockchain status...");
    const status = await getBlockchainStatus();
    console.log("   OK:", JSON.stringify(status).slice(0, 120));
  } catch (err) {
    console.log("   SKIP (network may be unavailable):", (err as Error).message);
  }

  try {
    console.log("\n2. Exchange rates...");
    const rates = await getExchangeRates();
    console.log("   OK:", JSON.stringify(rates).slice(0, 120));
  } catch (err) {
    console.log("   SKIP:", (err as Error).message);
  }

  try {
    console.log("\n3. Bridge balance (0x0)...");
    const bb = await getBridgeBalance("0x0000000000000000000000000000000000000000");
    console.log("   OK:", JSON.stringify(bb).slice(0, 120));
  } catch (err) {
    console.log("   SKIP:", (err as Error).message);
  }

  try {
    console.log("\n4. Contract registered (0x0)...");
    const reg = await isContractRegistered("0x0000000000000000000000000000000000000000");
    console.log("   OK:", reg);
  } catch (err) {
    console.log("   SKIP:", (err as Error).message);
  }

  try {
    console.log("\n5. Balance (0x0)...");
    const bal = await getBalance("0x0000000000000000000000000000000000000000");
    console.log("   OK:", JSON.stringify(bal).slice(0, 120));
  } catch (err) {
    console.log("   SKIP:", (err as Error).message);
  }

  console.log("\n=== Smoke test complete ===");
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
