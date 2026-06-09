/**
 * Live Toronet API Verification
 *
 * Tests every reachable SDK endpoint against the actual Toronet API,
 * documents exactly which operations work and which don't.
 *
 * Unlike smoke-test.ts (which is designed for CI), this script is designed
 * for manual debugging and root-cause documentation.
 *
 * Usage:
 *   npx tsx scripts/verify-live.ts
 *
 * Requires a properly configured .env file (especially TORONET_BASE_URL).
 */

interface Verdict {
  name: string;
  status: "OK" | "FAIL" | "INFO";
  detail: string;
}

const results: Verdict[] = [];

function ok(name: string, detail: string) {
  results.push({ name, status: "OK", detail });
}

function fail(name: string, detail: string) {
  results.push({ name, status: "FAIL", detail });
}

function info(name: string, detail: string) {
  results.push({ name, status: "INFO", detail });
}

async function main() {
  console.log("\n=== Toronet Live API Verification ===\n");

  // Phase 0: SDK initialization
  const toronet = await import("torosdk");
  const { env } = await import("../src/config/env.js");
  const { initializeToronetClient, getSDKConfig } = await import("../src/sdk/client.js");

  // Show effective config
  console.log("Environment:");
  console.log(`  TORONET_NETWORK = ${env.TORONET_NETWORK}`);
  console.log(`  TORONET_BASE_URL = ${env.TORONET_BASE_URL ?? "(not set — using SDK default)"}`);
  console.log(`  TORONET_CONNECT_W_URL = ${env.TORONET_CONNECT_W_URL ?? "(not set)"}`);
  console.log(`  TORONET_DEPLOYER_URL = ${env.TORONET_DEPLOYER_URL ?? "(not set)"}`);

  initializeToronetClient();
  const config = getSDKConfig();
  console.log(`\nEffective SDK config: ${JSON.stringify(config)}\n`);

  // Phase 1: Test the base URL connectivity
  try {
    const r = await toronet.getBlockchainStatus();
    ok("GET /blockchain/", JSON.stringify(r).slice(0, 200));
  } catch (e: any) {
    fail("GET /blockchain/", e.message?.slice(0, 200) ?? String(e));
  }

  // Phase 2: GET-based token endpoints
  for (const [name, op] of [["getTokenName", "getname"], ["getTokenSymbol", "getsymbol"], ["getTokenDecimal", "getdecimal"]] as const) {
    try {
      const r = await toronet[name]();
      ok(`GET /token/toro {op:"${op}"}`, JSON.stringify(r).slice(0, 200));
    } catch (e: any) {
      fail(`GET /token/toro {op:"${op}"}`, e.message?.slice(0, 200) ?? String(e));
    }
  }

  // Phase 3: POST-based query endpoints
  for (const [name, op] of [["getBalance", "getaddrbalance"], ["getSupportedAssetsExchangeRates", "getexchangerates"]] as const) {
    try {
      const params = name === "getBalance" ? { address: "0x0000000000000000000000000000000000000000" } : {};
      const r = await toronet[name](params as any);
      ok(`POST /query {op:"${op}"}`, JSON.stringify(r).slice(0, 200));
    } catch (e: any) {
      fail(`POST /query {op:"${op}"}`, e.message?.slice(0, 200) ?? String(e));
    }
  }

  // Phase 4: Token balance
  try {
    const r = await toronet.getTokenBalance({ address: "0x0000000000000000000000000000000000000000" });
    ok("GET /token/toro {op:\"getbalance\"}", JSON.stringify(r).slice(0, 200));
  } catch (e: any) {
    fail("GET /token/toro {op:\"getbalance\"}", e.message?.slice(0, 200) ?? String(e));
  }

  // Phase 5: TNS queries
  for (const [name, desc] of [["getName", "reverse-lookup"], ["getAddr", "resolve"]] as const) {
    try {
      const r = await toronet[name]({ address: "0x0000000000000000000000000000000000000000" });
      ok(`TNS ${desc}`, JSON.stringify(r).slice(0, 200));
    } catch (e: any) {
      fail(`TNS ${desc}`, e.message?.slice(0, 200) ?? String(e));
    }
  }

  // Phase 6: Deployer connectivity
  try {
    const r = await toronet.isContractRegistered("0x0000000000000000000000000000000000000000");
    ok("isContractRegistered", JSON.stringify(r).slice(0, 200));
  } catch (e: any) {
    fail("isContractRegistered", e.message?.slice(0, 200) ?? String(e));
  }

  // Print summary
  console.log("\n=== VERIFICATION RESULTS ===\n");
  const counts = { OK: 0, FAIL: 0, INFO: 0 };
  for (const r of results) {
    const icon = r.status === "OK" ? "✓" : r.status === "FAIL" ? "✗" : "ℹ";
    console.log(`  ${icon} ${r.name}: ${r.detail}`);
    counts[r.status]++;
  }
  console.log(`\n${counts.OK} OK, ${counts.FAIL} FAIL, ${counts.INFO} INFO`);

  // Final verdict
  if (counts.FAIL > 0) {
    console.log("\n⚠️  Some endpoints failed. See ROOT_CAUSE.md for analysis.");
    process.exit(1);
  }
  console.log("\n✅ All reachable endpoints working.");
}

main().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
