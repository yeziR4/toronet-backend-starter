import { getSDK } from "./client.js";
import { SdkError } from "../types/errors.js";
import { logger } from "../utils/logger.js";

function sdk() {
  return getSDK();
}

/**
 * Resolve a TNS (Toronet Naming System) name to its wallet address
 * Wraps torosdk.getAddr({ name }). TNS is similar to ENS on Ethereum — it
 * maps human-readable names (e.g. "alice.toro") to addresses. This is the
 * primary lookup direction: name → address.
 */
export async function resolveName(name: string): Promise<string | null> {
  try {
    const result = await sdk().getAddr({ name });
    return result?.address ?? result ?? null;
  } catch (err) {
    logger.warn({ err, name }, "TNS resolveName failed — network may be unavailable");
    return null;
  }
}

/**
 * Reverse-resolve an address to its TNS name
 * Wraps torosdk.getName({ address }). The reverse lookup direction: address → name.
 * Returns null if the address has no TNS name registered.
 */
export async function resolveAddress(address: string): Promise<string | null> {
  try {
    const result = await sdk().getName({ address });
    return typeof result === "string" ? result : result?.username ?? null;
  } catch (err) {
    logger.warn({ err, address }, "TNS resolveAddress failed — network may be unavailable");
    return null;
  }
}

/**
 * Check if a TNS name is available for registration
 * Wraps torosdk.isNameUsed(name) and inverts the result.
 * Names are globally unique on Toronet.
 */
export async function isNameAvailable(name: string): Promise<boolean> {
  try {
    return !(await sdk().isNameUsed(name));
  } catch (err) {
    logger.warn({ err, name }, "TNS isNameAvailable failed — network may be unavailable");
    return false;
  }
}

/**
 * Register a new TNS name for an address
 * Wraps torosdk.setName({ address, password, username }). Associates a
 * human-readable name with a wallet address. Requires password authentication
 * for the address's keystore.
 */
export async function setName(
  address: string,
  name: string,
  password: string,
): Promise<boolean> {
  try {
    await sdk().setName({ address, password, username: name });
    return true;
  } catch (err) {
    throw new SdkError(
      "setName",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Update an existing TNS name to a new name
 * Wraps torosdk.updateName({ address, password, username }). Allows a user
 * to change their registered TNS name to a different one.
 */
export async function updateName(
  address: string,
  name: string,
  newName: string,
  password: string,
): Promise<boolean> {
  try {
    await sdk().updateName({ address, password, username: newName });
    return true;
  } catch (err) {
    throw new SdkError(
      "updateName",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Delete a TNS name registration
 * Wraps torosdk.deleteName({ address, password }). Removes the name-to-address
 * mapping from the TNS registry.
 */
export async function deleteName(
  address: string,
  password: string,
): Promise<boolean> {
  try {
    await sdk().deleteName({ address, password });
    return true;
  } catch (err) {
    throw new SdkError(
      "deleteName",
      err instanceof Error ? err.message : String(err),
    );
  }
}
