import { getSDK } from "./client.js";
import { SdkError, ValidationError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

export interface TransferResult {
  success: boolean;
  txHash?: string;
}

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

export function getSupportedCurrencies(): string[] {
  return [
    "TORO", "USD", "EUR", "GBP", "NGN", "KSH", "ZAR", "EGP",
  ];
}

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
