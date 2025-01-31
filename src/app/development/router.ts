import express from "express";
import {
  allTemplatesGet,
  allTemplatesPost,
  templatesDisplayGet,
  serviceUnavailableGet,
} from "./middleware";

const router = express.Router();

router.post("/all-templates", allTemplatesPost);
router.get("/all-templates", allTemplatesGet);
router.get("/template/:templateId/:language", templatesDisplayGet);
router.get("/template/service-unavailable", serviceUnavailableGet);

export default router;
