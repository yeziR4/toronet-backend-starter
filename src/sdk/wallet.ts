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

/**
 * Create a new Toronet wallet
 * Wraps torosdk.createWallet({ username, password }) which generates a keypair
 * and stores it server-side. Returns the wallet address. Use for user onboarding
 * where Toronet manages keys.
 */
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

/**
 * Import existing wallet from private key
 * Wraps torosdk.importWalletFromPrivateKeyAndPassword. Used when a user already
 * has a wallet outside Toronet and wants to associate it with their account.
 */
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

/**
 * Import a raw private key and return the derived address
 * Lighter-weight than importWallet — only derives address without creating a keystore.
 */
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

/**
 * Verify a wallet password against the Toronet keystore
 * Wraps torosdk.verifyWalletPassword({ address, password }). Essential for
 * authenticating wallet operations that require password confirmation.
 */
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
