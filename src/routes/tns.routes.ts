import { Router, Request, Response, NextFunction } from "express";
import * as tns from "../sdk/tns.js";
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
  "/resolve/name/:name",
  asyncWrap(async (req, res) => {
    const name = req.params.name as string;
    if (!name) throw new ValidationError("name is required");
    const address = await tns.resolveName(name);
    sendSuccess(res, { name, address: address ?? null });
  }),
);

router.get(
  "/resolve/address/:address",
  asyncWrap(async (req, res) => {
    const address = req.params.address as string;
    if (!address) throw new ValidationError("address is required");
    const name = await tns.resolveAddress(address);
    sendSuccess(res, { address, name: name ?? null });
  }),
);

router.get(
  "/available/:name",
  asyncWrap(async (req, res) => {
    const name = req.params.name as string;
    const available = await tns.isNameAvailable(name);
    sendSuccess(res, { name, available });
  }),
);

router.post(
  "/register",
  asyncWrap(async (req, res) => {
    const { address, name, password } = req.body;
    if (!address || !name || !password) {
      throw new ValidationError("address, name, and password are required");
    }
    const result = await tns.setName(address, name, password);
    sendSuccess(res, { address, name, registered: result }, 201);
  }),
);

router.put(
  "/update",
  asyncWrap(async (req, res) => {
    const { address, name, newName, password } = req.body;
    if (!address || !name || !newName || !password) {
      throw new ValidationError(
        "address, name, newName, and password are required",
      );
    }
    const result = await tns.updateName(address, name, newName, password);
    sendSuccess(res, { address, oldName: name, newName, updated: result });
  }),
);

router.post(
  "/delete",
  asyncWrap(async (req, res) => {
    const { address, password } = req.body;
    if (!address || !password) {
      throw new ValidationError("address and password are required");
    }
    await tns.deleteName(address, password);
    sendSuccess(res, { deleted: true });
  }),
);

export default router;
