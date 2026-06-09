import { getSDK } from "./client.js";
import { SdkError, ValidationError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

export interface ContractDeployment {
  address?: string;
}

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

export async function isContractRegistered(
  contract: string,
): Promise<boolean> {
  try {
    const result = await sdk().isContractRegistered({ contract });
    return !!result;
  } catch {
    return false;
  }
}
