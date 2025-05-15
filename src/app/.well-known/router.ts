import express from "express";
import { getAppleAppSiteAssociation } from "./middleware";

const router = express.Router();

router.get("/apple-app-site-association", getAppleAppSiteAssociation);

export default router
