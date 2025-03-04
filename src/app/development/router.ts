import express from "express";
import {
  allTemplatesGet,
  allTemplatesPost,
  serviceUnavailableGet,
  templatesDisplayGet,
} from "./middleware";

const router = express.Router();

router.post("/all-templates", allTemplatesPost);
router.get("/all-templates", allTemplatesGet);
router.get("/template/service-unavailable/:language", serviceUnavailableGet);
router.get("/template/:templateId/:language", templatesDisplayGet);

export default router;
