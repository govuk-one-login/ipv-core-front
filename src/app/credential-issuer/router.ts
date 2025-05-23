import express from "express";
import { sendParamsToAPI, sendParamsToAPIV2 } from "./middleware";
import { csrfSynchronisedProtection } from "../../lib/csrf";

const router = express.Router();

router.get("/callback", csrfSynchronisedProtection, sendParamsToAPI);
router.get("/callback/:criId", csrfSynchronisedProtection, sendParamsToAPIV2);

export default router;
