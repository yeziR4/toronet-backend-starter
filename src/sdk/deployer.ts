import { getSDK } from "./client.js";
import { SdkError, ValidationError } from "../types/errors.js";
import { logger } from "../utils/logger.js";

function sdk() {
  return getSDK();
}

export interface ContractDeployment {
  address?: string;
}

/**
 * Deploy a Solidity smart contract to Toronet
 * Wraps torosdk.deployContract({ owner, constructorArgs, abi, bytecode }).
 * Toronet supports EVM-compatible smart contract deployment. The bytecode
 * and ABI are standard Solidity compilation artifacts. Returns the deployed
 * contract address on success.
 */
export async function deployContract(input: {
  owner: string;
  constructorArgs: unknown[];
  abi: unknown[];
  bytecode: string;
}): Promise<ContractDeployment> {
  if (!input.bytecode) throw new ValidationError("bytecode is required");
  try {
    const result = await sdk().deployContract(input);
    return { address: result?.address };
  } catch (err) {
    throw new SdkError(
      "deployContract",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Register a deployed contract in Toronet's on-chain registry
 * Wraps torosdk.registerContract({ address, password, contract }).
 * Registration makes the contract discoverable and queryable by other
 * contracts and off-chain services. Requires the contract owner's
 * authentication.
 */
export async function registerContract(params: {
  address: string;
  password: string;
  contract: string;
}): Promise<boolean> {
  try {
    await sdk().registerContract(params);
    return true;
  } catch (err) {
    throw new SdkError(
      "registerContract",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Check if a contract is registered in Toronet's on-chain registry
 * Wraps torosdk.isContractRegistered({ contract }). Read-only query
 * that checks if a contract address has been registered in the
 * Toronet contract registry.
 */
export async function isContractRegistered(
  contract: string,
): Promise<boolean> {
  try {
    const result = await sdk().isContractRegistered({ contract });
    return !!result;
  } catch (err) {
    logger.warn({ err, contract }, "isContractRegistered failed — network may be unavailable");
    return false;
  }
}
