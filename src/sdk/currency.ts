import axios from "axios";
import { getSDK } from "./client.js";
import { env } from "../config/env.js";
import { SdkError, ValidationError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

const TORO_TOKEN_URL = () =>
  (env.TORONET_BASE_URL ?? "https://testnet.toronet.org/api") + "/token/toro/cl";

const KEYSTORE_URL = () =>
  (env.TORONET_BASE_URL ?? "https://testnet.toronet.org/api") + "/keystore/";

export interface TransferResult {
  success: boolean;
  txHash?: string;
}

/**
 * Transfer a fiat currency (NGN, USD, EUR, etc.) between Toronet addresses
 * Wraps torosdk.transferCurrency({ currency, senderAddr, senderPwd, receiverAddr, amount }).
 * This is Toronet's core fiat transfer operation — unlike most blockchains,
 * Toronet supports native multi-currency transfers at the protocol level.
 * The senderPwd is required for server-side keystore authentication.
 */
export async function transferCurrency(params: {
  currency: string;
  senderAddr: string;
  senderPwd: string;
  receiverAddr: string;
  amount: string;
}): Promise<TransferResult> {
  if (!params.currency || !params.senderAddr || !params.receiverAddr || !params.amount) {
    throw new ValidationError("currency, senderAddr, receiverAddr, and amount are required");
  }
  try {
    const result = await sdk().transferCurrency(params);
    return { success: true, txHash: result?.txHash ?? result?.txid };
  } catch (err) {
    throw new SdkError(
      "transferCurrency",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Transfer TORO between wallets in the same keystore
 * Wraps torosdk.makeInterWalletTransfer(senderAddr, senderPwd, receiverAddr, amount, currencyName).
 * This is a convenience method for transferring between addresses that share
 * the same server-side keystore, avoiding on-chain gas costs.
 */
export async function makeInterWalletTransfer(
  senderAddr: string,
  senderPwd: string,
  receiverAddr: string,
  amount: string,
  currencyName: string,
): Promise<TransferResult> {
  if (!senderAddr || !receiverAddr || !amount) {
    throw new ValidationError("senderAddr, receiverAddr, and amount are required");
  }
  try {
    const result = await sdk().makeInterWalletTransfer(
      senderAddr,
      senderPwd,
      receiverAddr,
      amount,
      currencyName,
    );
    return { success: true, txHash: result?.txHash ?? result?.txid };
  } catch (err) {
    throw new SdkError(
      "makeInterWalletTransfer",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * List all fiat currencies supported by Toronet
 * Toronet is unique in supporting native multi-currency operations.
 * These currencies can be held, transferred, and exchanged within
 * the Toronet ecosystem without third-party stablecoins.
 */
export function getSupportedCurrencies(): string[] {
  return [
    "TORO", "USD", "EUR", "GBP", "NGN", "KSH", "ZAR", "EGP",
  ];
}

/**
 * Get current exchange rates for all supported assets
 * Wraps torosdk.getSupportedAssetsExchangeRates(). Returns the latest
 * conversion rates between TORO and supported fiat currencies.
 */
export async function getExchangeRates(): Promise<Record<string, unknown>> {
  try {
    return (await sdk().getSupportedAssetsExchangeRates()) ?? {};
  } catch (err) {
    throw new SdkError(
      "getSupportedAssetsExchangeRates",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Transfer TORO tokens between wallets via the custodial API.
 *
 * The torosdk v0.2.0 has no method for TORO token transfers — its
 * transferCurrency and makeInterWalletTransfer only handle fiat routes
 * (/currency/{path}/cl). The TORO token endpoint is at /token/toro/cl.
 *
 * This function POSTs directly to that endpoint with the wallet password
 * for server-side keystore signing (custodial mode).
 *
 * The API response does not include a tx hash directly, so the hash is
 * retrieved from the sender's transaction history after the transfer.
 *
 * Prerequisites:
 *   - sender's private key must be imported into the API keystore
 *   - sender must have sufficient TORO balance
 *   - sender and recipient must both be enrolled for TORO
 *
 * @returns txHash on success
 */
export async function transferToro(params: {
  senderAddr: string;
  senderPwd: string;
  receiverAddr: string;
  amount: string;
}): Promise<TransferResult> {
  if (!params.senderAddr || !params.senderPwd || !params.receiverAddr || !params.amount) {
    throw new ValidationError("senderAddr, senderPwd, receiverAddr, and amount are required");
  }
  try {
    const response = await axios.post(TORO_TOKEN_URL(), {
      op: "transfer",
      params: [
        { name: "client", value: params.senderAddr },
        { name: "clientpwd", value: params.senderPwd },
        { name: "to", value: params.receiverAddr },
        { name: "val", value: params.amount },
      ],
    });
    if (response.data.result === false) {
      throw new Error(response.data.error ?? "transfer failed");
    }
    // POST response doesn't include tx hash; query history to find it
    await sleep(2000);
    const txHash = await findLatestTx(params.senderAddr, params.receiverAddr);
    return { success: true, txHash };
  } catch (err) {
    throw new SdkError(
      "transferToro",
      err instanceof Error ? err.message : String(err),
    );
  }
}

async function findLatestTx(senderAddr: string, receiverAddr: string): Promise<string | undefined> {
  try {
    const resp = await axios.get(
      (env.TORONET_BASE_URL ?? "https://testnet.toronet.org/api") + "/query",
      {
        data: {
          op: "getaddrtransactions_toro",
          params: [
            { name: "addr", value: receiverAddr },
            { name: "count", value: "5" },
          ],
        },
      },
    );
    const txs = resp.data?.data;
    if (Array.isArray(txs) && txs.length > 0) {
      const match = txs.find((tx: { EV_From?: string }) => tx.EV_From?.toLowerCase() === senderAddr.toLowerCase());
      return match?.EV_Hash;
    }
  } catch {
    // tx hash is best-effort
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Import a private key into the API keystore.
 * Required before using transferToro in custodial mode.
 */
export async function importWalletKey(params: {
  privateKey: string;
  password: string;
}): Promise<string> {
  try {
    const response = await axios.post(KEYSTORE_URL(), {
      op: "importkey",
      params: [
        { name: "prvkey", value: params.privateKey },
        { name: "pwd", value: params.password },
      ],
    });
    if (!response.data.result) throw new Error(response.data.error ?? "import failed");
    return response.data.address as string;
  } catch (err) {
    throw new SdkError(
      "importWalletKey",
      err instanceof Error ? err.message : String(err),
    );
  }
}
