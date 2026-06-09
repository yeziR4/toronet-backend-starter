import { getSDK } from "./client.js";
import { SdkError, ValidationError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

export type BridgeChain =
  | "solana"
  | "polygon"
  | "bsc"
  | "base"
  | "arbitrum";

export interface BridgeFee {
  fee: string;
  chain: BridgeChain;
}

const CHAIN_NETWORK_MAP: Record<BridgeChain, string> = {
  solana: "sol",
  polygon: "poly",
  bsc: "bsc",
  base: "base",
  arbitrum: "arb",
};

/**
 * Get bridge fee estimate for transferring tokens from an external chain to Toronet
 * Wraps torosdk.getBridgeTokenFeeEstimate(network, params). The fee varies by
 * chain and current network conditions. Always check fees before initiating a transfer.
 */
export async function getBridgeFee(
  chain: BridgeChain,
  contractAddress: string,
  amount: string,
): Promise<BridgeFee> {
  const network = CHAIN_NETWORK_MAP[chain];
  if (!network) throw new ValidationError(`Unsupported chain: ${chain}`);
  try {
    const result = await sdk().getBridgeTokenFeeEstimate(network, {
      network,
      contractaddress: contractAddress,
      amount,
    });
    return { chain, fee: String(result?.fee ?? result?.amount ?? "0") };
  } catch (err) {
    throw new SdkError(
      `getBridgeTokenFee for ${chain}`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Bridge tokens from an external chain to Toronet
 * Wraps torosdk.bridgeTokenFromChain(network, params). This is Toronet's
 * cross-chain bridge feature. Supports Solana, Polygon, BSC, Base, and Arbitrum.
 * Tokens are locked on the source chain and minted on Toronet.
 */
export async function bridgeToken(
  chain: BridgeChain,
  params: {
    from: string;
    pwd: string;
    contractaddress: string;
    tokenname: string;
    amount: string;
  },
): Promise<Record<string, unknown>> {
  const network = CHAIN_NETWORK_MAP[chain];
  if (!network) throw new ValidationError(`Unsupported chain: ${chain}`);
  try {
    const result = await sdk().bridgeTokenFromChain(network, {
      ...params,
      network,
    });
    return (result ?? {}) as Record<string, unknown>;
  } catch (err) {
    throw new SdkError(
      `bridgeToken for ${chain}`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Get bridged token balance for an address on Solana
 * Wraps torosdk.getBridgeBalance(network, params, admin?, adminpwd?).
 * Queries the balance of tokens that have been bridged from external chains.
 * Requires admin credentials (the SDK's cryptoutils endpoint mandates
 * "admin" and "adminpwd" headers for all balance lookups).
 */
export async function getBridgeBalance(
  address: string,
  admin?: string,
  adminpwd?: string,
): Promise<Record<string, unknown>> {
  try {
    const result = await sdk().getBridgeBalance("sol", { address }, admin ?? "", adminpwd ?? "");
    return (result ?? {}) as Record<string, unknown>;
  } catch (err) {
    throw new SdkError(
      "getBridgeBalance",
      err instanceof Error ? err.message : String(err),
    );
  }
}
