import express from "express";
import { setIpvSessionId, handleOAuthJourneyAction } from "./middleware";
import { csrfSynchronisedProtection } from "../../lib/csrf";

const router = express.Router();

router.get(
  "/authorize",
  csrfSynchronisedProtection,
  setIpvSessionId,
  handleOAuthJourneyAction,
);

export default router;
