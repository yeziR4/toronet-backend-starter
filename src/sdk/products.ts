import { getSDK } from "./client.js";
import { SdkError, ValidationError } from "../types/errors.js";
import { logger } from "../utils/logger.js";

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

/**
 * Register a new product in the Toronet payment system
 * Wraps torosdk.recordProduct(product). Products are used for payment
 * processing — they represent items/services that customers can purchase
 * via Toronet's fiat payment gateway. Requires admin authentication.
 */
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

/**
 * Update an existing product in the Toronet payment system
 * Wraps torosdk.updateProduct(product). Allows modifying product details
 * like name, description, or image.
 */
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

/**
 * Get product details from the Toronet payment system
 * Wraps torosdk.getProduct({ productId, admin, adminpwd }). Returns product
 * metadata if the product exists and the admin credentials are valid.
 */
export async function getProduct(
  params: { productId: string; admin: string; adminpwd: string },
): Promise<Record<string, unknown> | null> {
  try {
    const result = await sdk().getProduct(params);
    return (result ?? null) as Record<string, unknown> | null;
  } catch (err) {
    logger.warn({ err, productId: params.productId }, "getProduct failed — product may not exist or network unavailable");
    return null;
  }
}
