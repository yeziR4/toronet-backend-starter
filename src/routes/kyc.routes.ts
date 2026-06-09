import { Router, Request, Response, NextFunction } from "express";
import * as kyc from "../sdk/kyc.js";
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
  "/setup",
  asyncWrap(async (req, res) => {
    const params = req.body;
    if (!params.address || !params.admin || !params.adminpwd) {
      throw new ValidationError(
        "address, admin, and adminpwd are required",
      );
    }
    const result = await kyc.setupKYC(params);
    sendSuccess(res, { setupComplete: result });
  }),
);

router.post(
  "/verify",
  asyncWrap(async (req, res) => {
    const params = req.body;
    if (!params.address) {
      throw new ValidationError("address is required");
    }
    const result = await kyc.performKYC(params);
    sendSuccess(res, result);
  }),
);

router.get(
  "/status/:address",
  asyncWrap(async (req, res) => {
    const address = req.params.address as string;
    if (!address) throw new ValidationError("address is required");
    const result = await kyc.checkKYC(address);
    sendSuccess(res, result);
  }),
);

router.post(
  "/enroll",
  asyncWrap(async (req, res) => {
    const { currency, address, admin, adminpwd, targetAddress } = req.body;
    if (!address || !currency || !admin || !adminpwd || !targetAddress) {
      throw new ValidationError(
        "currency, address, admin, adminpwd, and targetAddress are required",
      );
    }
    const result = await kyc.enrollAddress({
      currency,
      address,
      admin,
      adminpwd,
      targetAddress,
    });
    sendSuccess(res, { enrolled: result });
  }),
);

export default router;
