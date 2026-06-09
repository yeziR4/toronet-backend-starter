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
