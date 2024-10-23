import express from "express";
import { checkMobileAppDetails } from "./middleware";

const router = express.Router();

router.get("/callback", checkMobileAppDetails);

export default router;
