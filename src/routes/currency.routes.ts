import { Router, Request, Response, NextFunction } from "express";
import * as currency from "../sdk/currency.js";
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
  "/transfer",
  asyncWrap(async (req, res) => {
    const { currency: curr, senderAddr, senderPwd, receiverAddr, amount } = req.body;
    if (!curr || !senderAddr || !receiverAddr || !amount) {
      throw new ValidationError(
        "currency, senderAddr, receiverAddr, and amount are required",
      );
    }
    const result = await currency.transferCurrency({
      currency: curr,
      senderAddr,
      senderPwd: senderPwd ?? "",
      receiverAddr,
      amount,
    });
    sendSuccess(res, result);
  }),
);

router.post(
  "/inter-wallet",
  asyncWrap(async (req, res) => {
    const { from, to, amount, password, currencyName } = req.body;
    if (!from || !to || !amount) {
      throw new ValidationError("from, to, and amount are required");
    }
    const result = await currency.makeInterWalletTransfer(
      from,
      password ?? "",
      to,
      amount,
      currencyName ?? "TORO",
    );
    sendSuccess(res, result);
  }),
);

router.post(
  "/toro/transfer",
  asyncWrap(async (req, res) => {
    const { senderAddr, senderPwd, receiverAddr, amount } = req.body;
    if (!senderAddr || !senderPwd || !receiverAddr || !amount) {
      throw new ValidationError("senderAddr, senderPwd, receiverAddr, and amount are required");
    }
    const result = await currency.transferToro({
      senderAddr,
      senderPwd,
      receiverAddr,
      amount,
    });
    sendSuccess(res, result);
  }),
);

router.post(
  "/toro/import-key",
  asyncWrap(async (req, res) => {
    const { privateKey, password } = req.body;
    if (!privateKey || !password) {
      throw new ValidationError("privateKey and password are required");
    }
    const result = await currency.importWalletKey({ privateKey, password });
    sendSuccess(res, result, 201);
  }),
);

router.get(
  "/supported",
  asyncWrap(async (_req, res) => {
    const currencies = currency.getSupportedCurrencies();
    sendSuccess(res, { currencies });
  }),
);

router.get(
  "/rates",
  asyncWrap(async (_req, res) => {
    const rates = await currency.getExchangeRates();
    sendSuccess(res, rates);
  }),
);

export default router;
