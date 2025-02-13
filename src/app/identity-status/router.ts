import express from "express";
import { proveIdentityStatusCallbackGet } from "./middleware";

const router = express.Router();

router.get("/prove-identity-status", proveIdentityStatusCallbackGet);

export default router;
