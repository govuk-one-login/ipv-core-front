import express from "express";
import { getAppVcReceiptStatus } from "./middleware";

const router = express.Router();

router.get("/app-vc-receipt-status", getAppVcReceiptStatus);

export default router;
