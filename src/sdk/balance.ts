import { getSDK } from "./client.js";
import { SdkError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

export interface BalanceInfo {
  address: string;
  balance: string;
  unit?: string;
}

export async function getBalance(
  address: string,
): Promise<Record<string, unknown>> {
  try {
    return (await sdk().getBalance({ address })) ?? {};
  } catch (err) {
    throw new SdkError(
      "getBalance",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function getCurrencyBalance(
  address: string,
  currency: string,
): Promise<Record<string, unknown>> {
  try {
    return (await sdk().getCurrencyBalance({ currency, address })) ?? {};
  } catch (err) {
    throw new SdkError(
      "getCurrencyBalance",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function getTokenBalance(
  address: string,
): Promise<Record<string, unknown>> {
  try {
    return (await sdk().getTokenBalance({ address })) ?? {};
  } catch (err) {
    throw new SdkError(
      "getTokenBalance",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function getTokenInfo(
  _contractAddress: string,
): Promise<Record<string, unknown> | null> {
  try {
    const [name, symbol, decimals] = await Promise.all([
      sdk().getTokenName(),
      sdk().getTokenSymbol(),
      sdk().getTokenDecimal(),
    ]);
    return { name, symbol, decimals };
  } catch {
    return null;
  }
}
