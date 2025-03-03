import express from "express";
import { pollVcReceiptStatus } from "./middleware";

const router = express.Router();

router.get("/app-vc-receipt-status", pollVcReceiptStatus);

export default router;
