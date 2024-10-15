import express from "express";
import { setIpvSessionId, handleOAuthJourneyAction } from "./middleware";

const router = express.Router();

router.get("/authorize", setIpvSessionId, handleOAuthJourneyAction);

export default router;
