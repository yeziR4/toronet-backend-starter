import { getSDK } from "./client.js";
import { SdkError, ValidationError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

export interface KYCStatus {
  address: string;
  verified: boolean;
}

/**
 * Configure KYC verification parameters on Toronet
 * Wraps torosdk.setupKYC(params). Must be called by an admin account before
 * performing individual KYC verifications. This sets the system-level KYC
 * requirements (document types, verification levels, etc.).
 */
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

/**
 * Perform KYC verification for a customer
 * Wraps torosdk.performKYCForCustomer(params). This is the core KYC operation
 * that verifies a customer's identity against their submitted documents.
 * Requires admin credentials as this is a privileged operation.
 */
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

/**
 * Check if an address has completed KYC verification
 * Wraps torosdk.isAddressKYCVerified({ address }). Read-only query that
 * returns the verification status for a given address.
 */
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

/**
 * Enroll an address in the Toronet currency system
 * Wraps torosdk.enrollAddress(params). Before an address can hold or transfer
 * fiat currencies (NGN, USD, etc.), it must be enrolled by an admin. This is
 * a compliance measure specific to Toronet's fiat integration.
 */
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
