import { Router, Request, Response, NextFunction } from "express";
import * as balance from "../sdk/balance.js";
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

router.get(
  "/:address",
  asyncWrap(async (req, res) => {
    const address = req.params.address as string;
    if (!address) throw new ValidationError("address is required");
    const bal = await balance.getBalance(address);
    sendSuccess(res, bal);
  }),
);

router.get(
  "/:address/currency/:currency",
  asyncWrap(async (req, res) => {
    const address = req.params.address as string;
    const currency = (req.params.currency as string).toUpperCase();
    if (!address || !currency) {
      throw new ValidationError("address and currency are required");
    }
    const bal = await balance.getCurrencyBalance(address, currency);
    sendSuccess(res, bal);
  }),
);

router.get(
  "/:address/token",
  asyncWrap(async (req, res) => {
    const address = req.params.address as string;
    if (!address) {
      throw new ValidationError("address is required");
    }
    const bal = await balance.getTokenBalance(address);
    sendSuccess(res, bal);
  }),
);

router.get(
  "/token/:contractAddress/info",
  asyncWrap(async (req, res) => {
    const contractAddress = req.params.contractAddress as string;
    const info = await balance.getTokenInfo(contractAddress);
    sendSuccess(res, info ?? { error: "Token not found" });
  }),
);

export default router;
