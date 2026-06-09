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

/**
 * Get Toronet blockchain network status
 * Wraps torosdk.getBlockchainStatus() which returns current block count,
 * timestamp, and network health indicators. This is the primary health-check
 * endpoint for the Toronet node connection.
 */
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

/**
 * Fetch the latest block data from the Toronet chain
 * Useful for monitoring recent activity and confirming transactions
 * have been included in a block.
 */
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

/**
 * Get a specific block by its ID from the Toronet chain
 * Used for transaction verification and historical data access.
 */
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

/**
 * Get transaction details by transaction hash
 * Wraps torosdk.getTransaction(txHash) which returns the full transaction
 * record including sender, recipient, amount, and block confirmation.
 */
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
