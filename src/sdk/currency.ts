import axios from "axios";
import { getSDK } from "./client.js";
import { env } from "../config/env.js";
import { SdkError, ValidationError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

function baseURL(): string {
  return env.TORONET_BASE_URL ?? "https://testnet.toronet.org/api";
}

const TORO_TOKEN_URL = () => baseURL() + "/token/toro/cl";
const KEYSTORE_URL = () => baseURL() + "/keystore/";

export interface TransferResult {
  success: boolean;
  txHash?: string;
}

export interface ToroTransferResult {
  success: boolean;
  txHash?: string;
  sender?: string;
  receiver?: string;
  amount?: string;
}

export interface WalletKeyResult {
  success: boolean;
  address: string;
  message?: string;
}

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function isPositiveAmount(amt: string): boolean {
  const n = Number(amt);
  return !Number.isNaN(n) && n > 0 && /^\d+(\.\d+)?$/.test(amt);
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
 * Prerequisites:
 *   - sender's private key must be imported into the API keystore
 *     (use importWalletKey() first)
 *   - sender must have sufficient TORO balance
 *   - sender and recipient must both be enrolled for TORO
 *
 * The API POST response does not include a tx hash. If you need the
 * on-chain transaction ID, query the transaction history after calling
 * this function (or pass fetchTxHash=true).
 */
export async function transferToro(params: {
  senderAddr: string;
  senderPwd: string;
  receiverAddr: string;
  amount: string;
  fetchTxHash?: boolean;
}): Promise<ToroTransferResult> {
  if (!params.senderAddr || !params.senderPwd || !params.receiverAddr || !params.amount) {
    throw new ValidationError("senderAddr, senderPwd, receiverAddr, and amount are required");
  }
  if (!isValidAddress(params.senderAddr)) {
    throw new ValidationError("senderAddr must be a valid 0x-hex address (42 characters)");
  }
  if (!isValidAddress(params.receiverAddr)) {
    throw new ValidationError("receiverAddr must be a valid 0x-hex address (42 characters)");
  }
  if (!isPositiveAmount(params.amount)) {
    throw new ValidationError("amount must be a positive number");
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
    if (!response.data || typeof response.data !== "object") {
      throw new Error("malformed response from API");
    }
    if (response.data.result === false) {
      const errMsg = response.data.error ?? "transfer failed";
      throw new Error(errMsg);
    }
    let txHash: string | undefined;
    if (params.fetchTxHash) {
      txHash = await findLatestTx(params.senderAddr, params.receiverAddr);
    }
    return {
      success: true,
      txHash,
      sender: params.senderAddr,
      receiver: params.receiverAddr,
      amount: params.amount,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (err instanceof ValidationError) throw err;
    throw new SdkError("transferToro", message);
  }
}

async function findLatestTx(senderAddr: string, receiverAddr: string): Promise<string | undefined> {
  try {
    const resp = await axios.get(baseURL() + "/query", {
      data: {
        op: "getaddrtransactions_toro",
        params: [
          { name: "addr", value: receiverAddr },
          { name: "count", value: "5" },
        ],
      },
    });
    const txs = resp.data?.data;
    if (Array.isArray(txs) && txs.length > 0) {
      const match = txs.find((tx: { EV_From?: string }) => tx.EV_From?.toLowerCase() === senderAddr.toLowerCase());
      return match?.EV_Hash;
    }
  } catch {
    // tx hash retrieval is best-effort
  }
}

/**
 * Import a private key into the API keystore.
 * Required before using transferToro in custodial mode.
 *
 * Returns a normalized WalletKeyResult with the imported address.
 */
export async function importWalletKey(params: {
  privateKey: string;
  password: string;
}): Promise<WalletKeyResult> {
  if (!params.privateKey) {
    throw new ValidationError("privateKey is required");
  }
  if (!params.password) {
    throw new ValidationError("password is required");
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(params.privateKey)) {
    throw new ValidationError("privateKey must be a 64-char hex string with 0x prefix");
  }
  try {
    const response = await axios.post(KEYSTORE_URL(), {
      op: "importkey",
      params: [
        { name: "prvkey", value: params.privateKey },
        { name: "pwd", value: params.password },
      ],
    });
    if (!response.data || typeof response.data !== "object") {
      throw new Error("malformed response from API");
    }
    if (!response.data.result) {
      const errMsg = response.data.error ?? "import failed";
      if (errMsg.toLowerCase().includes("duplicate") || errMsg.toLowerCase().includes("already")) {
        return { success: true, address: response.data.address ?? "", message: errMsg };
      }
      throw new Error(errMsg);
    }
    const address = response.data.address as string;
    if (!address || !isValidAddress(address)) {
      throw new Error(`unexpected response shape: address missing or invalid`);
    }
    return { success: true, address, message: "key imported" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (err instanceof ValidationError) throw err;
    throw new SdkError("importWalletKey", message);
  }
}
