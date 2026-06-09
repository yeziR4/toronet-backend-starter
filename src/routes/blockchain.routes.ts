import { Router, Request, Response, NextFunction } from "express";
import * as blockchain from "../sdk/blockchain.js";
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
  "/status",
  asyncWrap(async (_req, res) => {
    const status = await blockchain.getBlockchainStatus();
    sendSuccess(res, status);
  }),
);

router.get(
  "/latest-block",
  asyncWrap(async (_req, res) => {
    const block = await blockchain.getLatestBlock();
    sendSuccess(res, block);
  }),
);

router.get(
  "/blocks/:blockId",
  asyncWrap(async (req, res) => {
    const blockId = req.params.blockId as string;
    if (!blockId) throw new ValidationError("blockId is required");
    const block = await blockchain.getBlockById(blockId);
    sendSuccess(res, block);
  }),
);

router.get(
  "/transactions/:txId",
  asyncWrap(async (req, res) => {
    const txId = req.params.txId as string;
    if (!txId) throw new ValidationError("txId is required");
    const tx = await blockchain.getTransaction(txId);
    sendSuccess(res, tx);
  }),
);

export default router;
