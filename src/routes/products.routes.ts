import { Router, Request, Response, NextFunction } from "express";
import * as products from "../sdk/products.js";
import { sendSuccess } from "../utils/response.js";
import { ValidationError } from "../types/errors.js";

const router: Router = Router();

function asyncWrap(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.post(
  "/",
  asyncWrap(async (req, res) => {
    const { productId, productName, description, productImage, admin, adminpwd } = req.body;
    if (!productName) throw new ValidationError("productName is required");
    const result = await products.recordProduct({
      productId: productId ?? "",
      productName,
      description: description ?? "",
      productImage: productImage ?? "",
      admin: admin ?? "",
      adminpwd: adminpwd ?? "",
    });
    sendSuccess(res, result, 201);
  }),
);

router.put(
  "/",
  asyncWrap(async (req, res) => {
    const { productId, productName, description, productImage, admin, adminpwd } = req.body;
    if (!productId) throw new ValidationError("productId is required");
    const result = await products.updateProduct({
      productId,
      productName: productName ?? "",
      description: description ?? "",
      productImage: productImage ?? "",
      admin: admin ?? "",
      adminpwd: adminpwd ?? "",
    });
    sendSuccess(res, result);
  }),
);

router.get(
  "/:productId",
  asyncWrap(async (req, res) => {
    const productId = req.params.productId as string;
    const admin = req.query.admin as string;
    const adminpwd = req.query.adminpwd as string;
    const result = await products.getProduct({
      productId,
      admin: admin ?? "",
      adminpwd: adminpwd ?? "",
    });
    sendSuccess(res, result ?? { error: "Product not found" });
  }),
);

export default router;
