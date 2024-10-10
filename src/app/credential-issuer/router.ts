import express from "express";
import csrf from "csurf";
import { sendParamsToAPI, sendParamsToAPIV2 } from "./middleware";

const router = express.Router();

const csrfProtection = csrf({});

router.get("/callback", csrfProtection, sendParamsToAPI);
router.get("/callback/:criId", csrfProtection, sendParamsToAPIV2);

export default router;
