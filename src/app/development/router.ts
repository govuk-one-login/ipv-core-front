import express from "express";
import {
  allTemplatesGet,
  allTemplatesPost,
  templatesDisplayGet,
} from "./middleware";
import { csrfSynchronisedProtection } from "../../lib/csrf";

const router = express.Router();

router.post("/all-templates", csrfSynchronisedProtection, allTemplatesPost);
router.get("/all-templates", csrfSynchronisedProtection, allTemplatesGet);
router.get(
  "/template/:templateId/:language",
  csrfSynchronisedProtection,
  templatesDisplayGet,
);

export default router;
