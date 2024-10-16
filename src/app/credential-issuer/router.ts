import express from "express";
import { sendParamsToAPI, sendParamsToAPIV2 } from "./middleware";

const router = express.Router();

router.get("/callback", sendParamsToAPI);
router.get("/callback/:criId", sendParamsToAPIV2);

export default router;
