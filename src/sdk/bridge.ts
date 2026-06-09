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

const CHAIN_FEE_MAP: Record<BridgeChain, string> = {
  solana: "sol",
  polygon: "poly",
  bsc: "bsc",
  base: "base",
  arbitrum: "arb",
};

export async function getBridgeFee(
  chain: BridgeChain,
  contractAddress: string,
  amount: string,
): Promise<BridgeFee> {
  const network = CHAIN_FEE_MAP[chain];
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
  const network = CHAIN_FEE_MAP[chain];
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

export async function getBridgeBalance(
  address: string,
): Promise<Record<string, unknown>> {
  try {
    const result = await sdk().getBridgeBalance("sol", { address });
    return (result ?? {}) as Record<string, unknown>;
  } catch (err) {
    throw new SdkError(
      "getBridgeBalance",
      err instanceof Error ? err.message : String(err),
    );
  }
}
