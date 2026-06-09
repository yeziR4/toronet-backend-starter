import { Router, Request, Response, NextFunction } from "express";
import * as deployer from "../sdk/deployer.js";
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
  "/deploy",
  asyncWrap(async (req, res) => {
    const { owner, bytecode, abi, constructorArgs } = req.body;
    if (!bytecode) throw new ValidationError("bytecode is required");
    const result = await deployer.deployContract({
      owner: owner ?? "",
      constructorArgs: constructorArgs ?? [],
      abi: abi ?? [],
      bytecode,
    });
    sendSuccess(res, result, 201);
  }),
);

router.post(
  "/register",
  asyncWrap(async (req, res) => {
    const { address, password, contract } = req.body;
    if (!address || !contract) {
      throw new ValidationError("address, password, and contract are required");
    }
    const result = await deployer.registerContract({
      address,
      password: password ?? "",
      contract,
    });
    sendSuccess(res, { contract, registered: result });
  }),
);

router.get(
  "/check/:contract",
  asyncWrap(async (req, res) => {
    const contract = req.params.contract as string;
    if (!contract) throw new ValidationError("contract is required");
    const registered = await deployer.isContractRegistered(contract);
    sendSuccess(res, { contract, registered });
  }),
);

export default router;
