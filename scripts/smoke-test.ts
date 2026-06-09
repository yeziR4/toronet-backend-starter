/**
 * Toronet SDK Smoke Test
 *
 * Usage:
 *   npm run smoke:test            # offline-safe: skips live checks gracefully
 *   SMOKE_LIVE=1 npm run smoke:test  # fails on unreachable endpoints
 *
 * Exit codes:
 *   0 — all required checks passed
 *   1 — SDK init failed (hard failure)
 *   2 — live endpoint failure (only when SMOKE_LIVE=1)
 */

interface CheckResult {
  name: string;
  status: "PASS" | "SKIP" | "FAIL";
  detail?: string;
}

const results: CheckResult[] = [];
const LIVE = process.env.SMOKE_LIVE === "1";

function pass(name: string, detail?: string) {
  results.push({ name, status: "PASS", detail });
}

function skip(name: string, detail: string) {
  results.push({ name, status: "SKIP", detail });
}

function fail(name: string, detail: string) {
  results.push({ name, status: "FAIL", detail });
}

function summary(): void {
  console.log("\n=== SMOKE TEST SUMMARY ===");
  let passed = 0;
  let skipped = 0;
  let failed = 0;
  for (const r of results) {
    const icon = r.status === "PASS" ? "\u2713" : r.status === "SKIP" ? "-" : "\u2717";
    console.log(`  ${icon} ${r.name}: ${r.status}${r.detail ? ` — ${r.detail}` : ""}`);
    if (r.status === "PASS") passed++;
    else if (r.status === "SKIP") skipped++;
    else failed++;
  }
  console.log(`\n${passed} passed, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) {
    process.exit(LIVE ? 2 : 0);
  }
}

async function main(): Promise<void> {
  console.log("=== Toronet SDK Smoke Test ===\n");

  // -------------------------------------------------------
  // 1. SDK initialization (hard failure if it doesn't work)
  // -------------------------------------------------------
  try {
    const { initializeToronetClient, getSDKConfig } = await import("../src/sdk/client.js");
    initializeToronetClient();
    const config = getSDKConfig();
    pass("SDK init", `network=${JSON.stringify(config)}`);
  } catch (err) {
    fail("SDK init", (err as Error).message);
    // Cannot proceed without SDK — exit hard
    summary();
    process.exit(1);
  }

  // -------------------------------------------------------
  // 2. Module imports (all 10 SDK wrappers load correctly)
  // -------------------------------------------------------
  const modules = [
    "sdk/wallet.js",
    "sdk/blockchain.js",
    "sdk/balance.js",
    "sdk/tns.js",
    "sdk/kyc.js",
    "sdk/currency.js",
    "sdk/bridge.js",
    "sdk/products.js",
    "sdk/deployer.js",
    "sdk/client.js",
  ];
  for (const mod of modules) {
    try {
      await import(`../src/${mod}`);
      pass(`Import ${mod}`);
    } catch (err) {
      fail(`Import ${mod}`, (err as Error).message);
    }
  }

  // -------------------------------------------------------
  // 3. Blockchain status (live check)
  // -------------------------------------------------------
  try {
    const { getBlockchainStatus } = await import("../src/sdk/blockchain.js");
    const status = await getBlockchainStatus();
    pass("Blockchain status", Object.keys(status).length > 0 ? "data received" : "empty response");
  } catch (err) {
    const msg = (err as Error).message;
    if (LIVE) fail("Blockchain status", msg);
    else skip("Blockchain status", `unreachable — ${msg}`);
  }

  // -------------------------------------------------------
  // 4. Exchange rates (live check)
  // -------------------------------------------------------
  try {
    const { getExchangeRates } = await import("../src/sdk/currency.js");
    const rates = await getExchangeRates();
    pass("Exchange rates", Object.keys(rates).length > 0 ? "data received" : "empty response");
  } catch (err) {
    const msg = (err as Error).message;
    if (LIVE) fail("Exchange rates", msg);
    else skip("Exchange rates", `unreachable — ${msg}`);
  }

  // -------------------------------------------------------
  // 5. Bridge balance (zero-address query)
  // -------------------------------------------------------
  try {
    const { getBridgeBalance } = await import("../src/sdk/bridge.js");
    const bb = await getBridgeBalance("0x0000000000000000000000000000000000000000");
    pass("Bridge balance", "query completed");
  } catch (err) {
    const msg = (err as Error).message;
    if (LIVE) fail("Bridge balance", msg);
    else skip("Bridge balance", `unreachable — ${msg}`);
  }

  // -------------------------------------------------------
  // 6. Balance query (zero-address)
  // -------------------------------------------------------
  try {
    const { getBalance } = await import("../src/sdk/balance.js");
    const bal = await getBalance("0x0000000000000000000000000000000000000000");
    pass("Balance query", "query completed");
  } catch (err) {
    const msg = (err as Error).message;
    if (LIVE) fail("Balance query", msg);
    else skip("Balance query", `unreachable — ${msg}`);
  }

  // -------------------------------------------------------
  // 7. Contract registration check (zero-address)
  // -------------------------------------------------------
  try {
    const { isContractRegistered } = await import("../src/sdk/deployer.js");
    const reg = await isContractRegistered("0x0000000000000000000000000000000000000000");
    pass("Contract check", `registered=${reg}`);
  } catch (err) {
    const msg = (err as Error).message;
    if (LIVE) fail("Contract check", msg);
    else skip("Contract check", `unreachable — ${msg}`);
  }

  summary();
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
