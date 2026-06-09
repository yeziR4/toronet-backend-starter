import { getSDK } from "./client.js";
import { SdkError, ValidationError } from "../types/errors.js";

function sdk() {
  return getSDK();
}

export interface Product {
  productId: string;
  productName: string;
  description: string;
  productImage: string;
  admin: string;
  adminpwd: string;
}

export async function recordProduct(
  product: Product,
): Promise<Record<string, unknown>> {
  if (!product.productName) {
    throw new ValidationError("productName is required");
  }
  try {
    const result = await sdk().recordProduct(product);
    return (result ?? {}) as Record<string, unknown>;
  } catch (err) {
    throw new SdkError(
      "recordProduct",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function updateProduct(
  product: Product,
): Promise<Record<string, unknown>> {
  if (!product.productId) {
    throw new ValidationError("productId is required");
  }
  try {
    const result = await sdk().updateProduct(product);
    return (result ?? {}) as Record<string, unknown>;
  } catch (err) {
    throw new SdkError(
      "updateProduct",
      err instanceof Error ? err.message : String(err),
    );
  }
}

export async function getProduct(
  params: { productId: string; admin: string; adminpwd: string },
): Promise<Record<string, unknown> | null> {
  try {
    const result = await sdk().getProduct(params);
    return (result ?? null) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}
