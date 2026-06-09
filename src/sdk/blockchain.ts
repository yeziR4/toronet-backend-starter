import { getSDK } from "./client.js";
import { SdkError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

export interface BlockchainStatus {
  blockCount?: number;
  timestamp?: string;
  [key: string]: unknown;
}

export async function getBlockchainStatus(): Promise<BlockchainStatus> {
  try {
    return (await sdk().getBlockchainStatus()) ?? {};
  } catch (err) {
    throw new SdkError(
      "getBlockchainStatus",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function getLatestBlock(): Promise<Record<string, unknown>> {
  try {
    return (await sdk().getLatestBlockData()) ?? {};
  } catch (err) {
    throw new SdkError(
      "getLatestBlockData",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function getBlockById(
  blockId: string,
): Promise<Record<string, unknown>> {
  try {
    return (await sdk().getBlockById(blockId)) ?? {};
  } catch (err) {
    throw new SdkError(
      "getBlockById",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function getTransaction(
  txId: string,
): Promise<Record<string, unknown>> {
  try {
    return (await sdk().getTransaction(txId)) ?? {};
  } catch (err) {
    throw new SdkError(
      "getTransaction",
      err instanceof Error ? err.message : String(err),
    );
  }
}
