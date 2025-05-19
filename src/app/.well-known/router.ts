import express from "express";
import { getAndroidAssetLinks, getAppleAppSiteAssociation } from "./middleware";

const router = express.Router();

router.get("/apple-app-site-association", getAppleAppSiteAssociation);
router.get("/assetlinks.json", getAndroidAssetLinks);

export default router;
