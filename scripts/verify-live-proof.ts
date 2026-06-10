/**
 * Reviewer-safe live proof script for the Toronet Backend Starter Kit.
 *
 * By default this script is READ-ONLY — it queries the live API, checks
 * blockchain status, wallet balance, and network identity WITHOUT sending
 * any transactions or modifying any state.
 *
 * To perform a live TORO transfer, pass `--transfer <recipient> [amount]`.
 * Requires WALLET_PRIVATE_KEY and WALLET_PASSWORD in .env.
 *
 * Secrets are NEVER logged, printed, or committed.
 *
 * Usage:
 *   npx tsx scripts/verify-live-proof.ts                  # read-only
 *   npx tsx scripts/verify-live-proof.ts --transfer 0x... # 1 TORO transfer
 *   npx tsx scripts/verify-live-proof.ts --transfer 0x.. 5 # 5 TORO transfer
 */
import { env } from "../src/config/env.js";
import axios from "axios";

const BASE = env.TORONET_BASE_URL ?? "https://testnet.toronet.org/api";
const SENDER = "0xe09729896fa906c336b2Ed36a7A08BB19E5De194";

async function query(endpoint: string, op: string, params: any[] = []) {
  const r = await axios.get(BASE + endpoint, {
    data: { op, params },
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  });
  return r.data;
}

async function main() {
  const transferFlag = process.argv.indexOf("--transfer");
  const doTransfer = transferFlag !== -1;
  const recipient = doTransfer ? process.argv[transferFlag + 1] : undefined;
  const amount = doTransfer ? (process.argv[transferFlag + 2] ?? "1") : "1";

  console.log("\n═══════════════════════════════════════════");
  console.log("  Toronet Live Proof — Read-Only Mode");
  console.log("═══════════════════════════════════════════\n");
  console.log(`  API Base:  ${BASE}`);
  console.log(`  Wallet:    ${SENDER}`);

  // 1. Blockchain status — identify the network
  const status = await query("/blockchain", "getstatus");
  const chain = status.blockchaininfo?.chain ?? "unknown";
  const chainid = status.blockchaininfo?.chainid ?? "unknown";
  console.log(`\n[1/5] Blockchain:`);
  console.log(`  Chain:     ${chain} (ID: ${chainid})`);

  // 2. Sender TORO balance
  const bal = await query("/token/toro/", "getbalance", [{ name: "addr", value: SENDER }]);
  console.log(`\n[2/5] Sender TORO balance:`);
  console.log(`  Balance:   ${bal.balance ?? "0"} TORO`);

  // 3. Token supply statistics
  const cap = await query("/token/toro/", "gettotalcap");
  const circ = await query("/token/toro/", "gettotalcirculating");
  console.log(`\n[3/5] Token supply:`);
  console.log(`  Total cap:      ${cap.totalcap ?? "?"} TORO`);
  console.log(`  Circulating:    ${circ.totalcirculating ?? "?"} TORO`);

  // 4. Enrollment and role
  const enrolled = await query("/token/toro/", "isenrolled", [{ name: "addr", value: SENDER }]);
  const role = await query("/query", "getaddrrole", [{ name: "addr", value: SENDER }]);
  console.log(`\n[4/5] Wallet status:`);
  console.log(`  Enrolled:  ${enrolled.isenrolled === true ? "✅ YES" : "❌ NO"}`);
  console.log(`  Role:      ${role.role ?? "unknown"}`);

  // 5. Transaction history (last 3)
  const txs = await query("/query", "getaddrtransactions_toro", [
    { name: "addr", value: SENDER },
    { name: "count", value: "3" },
  ]);
  console.log(`\n[5/5] Recent transactions:`);
  if (Array.isArray(txs.data) && txs.data.length > 0) {
    for (const tx of txs.data.slice(0, 3)) {
      console.log(`  ${tx.EV_Event}: ${tx.EV_Value} TORO ${tx.EV_To ? "→ " + tx.EV_To.slice(0, 10) + "..." : ""}  (${(tx.EV_Time ?? "").slice(0, 10)})`);
      console.log(`    Tx: ${tx.EV_Hash}`);
    }
  } else {
    console.log(`  (no transactions found)`);
  }

  // Verdict
  const balanceOk = parseFloat(bal.balance ?? "0") > 0;
  const chainOk = chain === "testnet" && (chainid === 54321 || chainid === 7777);
  const enrolledOk = enrolled.isenrolled === true;

  const passedChecks = [chainOk, enrolledOk, balanceOk].filter(Boolean).length;
  console.log(`\n─── Verdict ───`);
  console.log(`  Blockchain reachable:  ${chainOk ? "✅" : "❌"}`);
  console.log(`  Wallet enrolled:       ${enrolledOk ? "✅" : "❌"}`);
  console.log(`  Positive balance:      ${balanceOk ? "✅" : "❌"}`);
  console.log(`  Checks passed:         ${passedChecks}/3`);
  console.log(`\n  ${passedChecks === 3 ? "🎉 All checks pass — the integration is live and working." : "⚠️  Some checks failed — see ROOT_CAUSE.md."}`);

  // Optional: execute a TORO transfer
  if (doTransfer) {
    if (!recipient) {
      console.error("\n❌ --transfer requires a recipient address.");
      console.error("   Usage: --transfer <0x...> [amount]");
      process.exit(1);
    }
    const pk = process.env.WALLET_PRIVATE_KEY;
    const pw = process.env.WALLET_PASSWORD;
    if (!pk || !pw) {
      console.error("\n❌ WALLET_PRIVATE_KEY and WALLET_PASSWORD must be set in .env for transfers.");
      process.exit(1);
    }

    console.log(`\n─── Executing Transfer ───`);
    console.log(`  Recipient: ${recipient}`);
    console.log(`  Amount:    ${amount} TORO`);

    const { importWalletKey, transferToro } = await import("../src/sdk/currency.js");

    const addr = await importWalletKey({ privateKey: pk, password: pw });
    console.log(`  Wallet:    ${addr}`);

    const result = await transferToro({ senderAddr: addr, senderPwd: pw, receiverAddr: recipient, amount });
    console.log(`  ✅ Transfer complete!`);
    if (result.txHash) {
      console.log(`  Tx hash:   ${result.txHash}`);
    }

    const newBal = await query("/token/toro/", "getbalance", [{ name: "addr", value: SENDER }]);
    console.log(`  New balance: ${newBal.balance} TORO`);

    const rcptBal = await query("/token/toro/", "getbalance", [{ name: "addr", value: recipient }]);
    console.log(`  Recipient:   ${rcptBal.balance} TORO`);
  }

  console.log("");
}

main().catch((err) => {
  console.error("\n❌ Proof script failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
