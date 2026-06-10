/**
 * One-shot TORO transfer via custodial API.
 *
 * Prerequisites (.env):
 *   TORONET_BASE_URL=https://testnet.toronet.org/api
 *   WALLET_PRIVATE_KEY=0x...   (sender's private key)
 *   WALLET_PASSWORD=...        (sender's keystore password)
 *
 * Usage: npx tsx scripts/transfer-toro.ts <recipient> <amount>
 *
 * Example: npx tsx scripts/transfer-toro.ts 0xdbeca6ffCc3d4eAa8389e16190B4c733E998D179 1
 */
import { env } from "../src/config/env.js";
import { importWalletKey, transferToro } from "../src/sdk/currency.js";
import axios from "axios";

const BASE = env.TORONET_BASE_URL ?? "https://testnet.toronet.org/api";

async function main() {
  const recipient = process.argv[2];
  const amount = process.argv[3] ?? "1";

  if (!recipient) {
    console.error("Usage: npx tsx scripts/transfer-toro.ts <recipient> <amount>");
    process.exit(1);
  }

  const privateKey = process.env.WALLET_PRIVATE_KEY;
  const password = process.env.WALLET_PASSWORD;

  if (!privateKey || !password) {
    console.error("WALLET_PRIVATE_KEY and WALLET_PASSWORD must be set in .env");
    process.exit(1);
  }

  console.log(`\n=== TORO Transfer ===`);
  console.log(`  Base URL:    ${BASE}`);
  console.log(`  Recipient:   ${recipient}`);
  console.log(`  Amount:      ${amount} TORO`);

  // derive address from SDK or skip — just import and transfer
  console.log(`\n[1/3] Importing wallet key into keystore...`);
  const address = await importWalletKey({ privateKey, password });
  console.log(`  ✅ Wallet address: ${address}`);

  // get balance before
  console.log(`\n[2/3] Checking sender balance...`);
  const balResp = await axios.get(`${BASE}/token/toro/`, {
    data: { op: "getbalance", params: [{ name: "addr", value: address }] },
  });
  const beforeBalance = balResp.data.balance ?? "0";
  console.log(`  Sender balance: ${beforeBalance} TORO`);

  console.log(`\n[3/3] Executing custodial transfer...`);
  const result = await transferToro({
    senderAddr: address,
    senderPwd: password,
    receiverAddr: recipient,
    amount,
  });
  console.log(`  ✅ Transfer complete!`);
  if (result.txHash) {
    console.log(`  Tx hash: ${result.txHash}`);
    console.log(`  Explorer: https://toronet.org/explorer/tx.html?txhash=${result.txHash}`);
  } else {
    console.log(`  (tx hash not immediately available — check recipient balance)`);
  }

  // check recipient balance
  const rcptResp = await axios.get(`${BASE}/token/toro/`, {
    data: { op: "getbalance", params: [{ name: "addr", value: recipient }] },
  });
  console.log(`  Recipient balance: ${rcptResp.data.balance ?? "0"} TORO`);

  console.log(`\n🎉 Done.`);
}

main().catch((err) => {
  console.error("\n❌ Transfer failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
