const express = require("express");
const csrf = require("csurf");
const router = express.Router();

const {
  allTemplatesGet,
  allTemplatesPost,
  templatesDisplayGet,
} = require("./middleware");

const csrfProtection = csrf({});

router.post("/all-templates", csrfProtection, allTemplatesPost);
router.get("/all-templates", csrfProtection, allTemplatesGet);
router.get(
  "/template/:templateId/:language",
  csrfProtection,
  templatesDisplayGet,
);

module.exports = router;
