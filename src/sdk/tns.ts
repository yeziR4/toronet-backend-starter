import { getSDK } from "./client.js";
import { SdkError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

export interface TNSRecord {
  name: string;
  address?: string;
}

export async function resolveName(name: string): Promise<string | null> {
  try {
    const result = await sdk().getAddr({ name });
    return result?.address ?? result ?? null;
  } catch {
    return null;
  }
}

export async function resolveAddress(address: string): Promise<string | null> {
  try {
    const result = await sdk().getName({ address });
    return typeof result === "string" ? result : result?.username ?? null;
  } catch {
    return null;
  }
}

export async function isNameAvailable(name: string): Promise<boolean> {
  try {
    return !(await sdk().isNameUsed(name));
  } catch {
    return false;
  }
}

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
