import { Router, Request, Response, NextFunction } from "express";
import * as bridge from "../sdk/bridge.js";
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
  "/fees/:chain",
  asyncWrap(async (req, res) => {
    const chain = req.params.chain as bridge.BridgeChain;
    const { contractAddress, amount } = req.query;
    if (!contractAddress || !amount) {
      throw new ValidationError("contractAddress and amount query params are required");
    }
    const fee = await bridge.getBridgeFee(
      chain,
      contractAddress as string,
      amount as string,
    );
    sendSuccess(res, fee);
  }),
);

router.post(
  "/transfer",
  asyncWrap(async (req, res) => {
    const { chain, from, pwd, contractaddress, tokenname, amount } = req.body;
    if (!chain || !from || !contractaddress || !tokenname || !amount) {
      throw new ValidationError(
        "chain, from, contractaddress, tokenname, and amount are required",
      );
    }
    const result = await bridge.bridgeToken(chain as bridge.BridgeChain, {
      from,
      pwd: pwd ?? "",
      contractaddress,
      tokenname,
      amount,
    });
    sendSuccess(res, result);
  }),
);

router.get(
  "/balance/:address",
  asyncWrap(async (req, res) => {
    const address = req.params.address as string;
    if (!address) throw new ValidationError("address is required");
    const admin = req.query.admin as string | undefined;
    const adminpwd = req.query.adminpwd as string | undefined;
    const balance = await bridge.getBridgeBalance(address, admin, adminpwd);
    sendSuccess(res, balance);
  }),
);

export default router;
