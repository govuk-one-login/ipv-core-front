import express from "express";
import { pollVcReceiptStatus } from "./middleware";

const router = express.Router();

router.get("/", pollVcReceiptStatus);

export default router;
