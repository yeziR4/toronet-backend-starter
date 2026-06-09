import { getSDK } from "./client.js";
import { SdkError, ValidationError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

export interface WalletInfo {
  address: string;
}

export interface ImportWalletInput {
  privateKey: string;
  password: string;
}

export async function createWallet(
  username: string,
  password: string,
): Promise<WalletInfo> {
  try {
    const address = await sdk().createWallet({ username, password });
    return { address };
  } catch (err) {
    throw new SdkError(
      "createWallet",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function importWallet(
  input: ImportWalletInput,
): Promise<WalletInfo> {
  if (!input.privateKey || !input.password) {
    throw new ValidationError("privateKey and password are required");
  }
  try {
    const result = await sdk().importWalletFromPrivateKeyAndPassword({
      pvKey: input.privateKey,
      password: input.password,
    });
    return { address: result?.address ?? result };
  } catch (err) {
    throw new SdkError(
      "importWalletFromPrivateKeyAndPassword",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function importKey(
  privateKey: string,
  password: string,
): Promise<string> {
  try {
    return await sdk().importKey({ privateKey, password });
  } catch (err) {
    throw new SdkError(
      "importKey",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function verifyWalletPassword(
  address: string,
  password: string,
): Promise<boolean> {
  try {
    return !!(await sdk().verifyWalletPassword({ address, password }));
  } catch (err) {
    throw new SdkError(
      "verifyWalletPassword",
      err instanceof Error ? err.message : String(err),
    );
  }
}
