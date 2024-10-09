import express from "express";
import csrf from "csurf";
import { allTemplatesGet, allTemplatesPost, templatesDisplayGet } from "./middleware";

const router = express.Router();

const csrfProtection = csrf({});

router.post("/all-templates", csrfProtection, allTemplatesPost);
router.get("/all-templates", csrfProtection, allTemplatesGet);
router.get(
  "/template/:templateId/:language",
  csrfProtection,
  templatesDisplayGet,
);

export default router;
