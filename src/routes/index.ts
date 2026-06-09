import { Router } from "express";
import walletRoutes from "./wallet.routes.js";
import blockchainRoutes from "./blockchain.routes.js";
import balanceRoutes from "./balance.routes.js";
import tnsRoutes from "./tns.routes.js";
import kycRoutes from "./kyc.routes.js";
import currencyRoutes from "./currency.routes.js";
import bridgeRoutes from "./bridge.routes.js";
import productsRoutes from "./products.routes.js";
import deployerRoutes from "./deployer.routes.js";

const router: Router = Router();

router.use("/wallet", walletRoutes);
router.use("/blockchain", blockchainRoutes);
router.use("/balance", balanceRoutes);
router.use("/tns", tnsRoutes);
router.use("/kyc", kycRoutes);
router.use("/currency", currencyRoutes);
router.use("/bridge", bridgeRoutes);
router.use("/products", productsRoutes);
router.use("/deployer", deployerRoutes);

export default router;
