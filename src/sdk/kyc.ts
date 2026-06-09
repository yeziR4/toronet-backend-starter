import { getSDK } from "./client.js";
import { SdkError, ValidationError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

export interface KYCStatus {
  address: string;
  verified: boolean;
}

export async function setupKYC(params: {
  firstName: string;
  middleName: string;
  lastName: string;
  bvn: string;
  currency: string;
  phoneNumber: string;
  dob: string;
  address: string;
  admin: string;
  adminpwd: string;
}): Promise<boolean> {
  try {
    return !!(await sdk().setupKYC(params));
  } catch (err) {
    throw new SdkError(
      "setupKYC",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function performKYC(params: {
  firstName: string;
  middleName: string;
  lastName: string;
  bvn: string;
  currency: string;
  phoneNumber: string;
  dob: string;
  address: string;
  admin: string;
  adminpwd: string;
}): Promise<KYCStatus> {
  try {
    const result = await sdk().performKYCForCustomer(params);
    return { address: params.address, verified: !!result };
  } catch (err) {
    throw new SdkError(
      "performKYCForCustomer",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function checkKYC(address: string): Promise<KYCStatus> {
  if (!address) throw new ValidationError("address is required");
  try {
    const result = await sdk().isAddressKYCVerified({ address });
    return { address, verified: !!result.verified };
  } catch (err) {
    throw new SdkError(
      "isAddressKYCVerified",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function enrollAddress(params: {
  currency: string;
  address: string;
  admin: string;
  adminpwd: string;
  targetAddress: string;
}): Promise<boolean> {
  try {
    await sdk().enrollAddress(params);
    return true;
  } catch (err) {
    throw new SdkError(
      "enrollAddress",
      err instanceof Error ? err.message : String(err),
    );
  }
}
