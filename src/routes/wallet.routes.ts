import { Router, Request, Response, NextFunction } from "express";
import * as wallet from "../sdk/wallet.js";
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
  "/create",
  asyncWrap(async (req, res) => {
    const { username, password } = req.body;
    if (!password) throw new ValidationError("password is required");
    const result = await wallet.createWallet(username ?? "default", password);
    sendSuccess(res, result, 201);
  }),
);

router.post(
  "/import",
  asyncWrap(async (req, res) => {
    const { privateKey, password } = req.body;
    const result = await wallet.importWallet({ privateKey, password });
    sendSuccess(res, result);
  }),
);

router.post(
  "/import-key",
  asyncWrap(async (req, res) => {
    const { privateKey, password } = req.body;
    if (!privateKey) throw new ValidationError("privateKey is required");
    const result = await wallet.importKey(privateKey, password ?? "");
    sendSuccess(res, { address: result });
  }),
);

router.post(
  "/verify",
  asyncWrap(async (req, res) => {
    const { address, password } = req.body;
    if (!address || !password) {
      throw new ValidationError("address and password are required");
    }
    const valid = await wallet.verifyWalletPassword(address, password);
    sendSuccess(res, { address, valid });
  }),
);

export default router;
