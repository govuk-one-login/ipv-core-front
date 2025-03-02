import express from "express";
import { getAppVcReceiptStatusAndStoreJourneyResponse } from "./middleware";

const router = express.Router();

router.get(
  "/app-vc-receipt-status",
  getAppVcReceiptStatusAndStoreJourneyResponse,
);

export default router;
