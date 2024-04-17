const express = require("express");
const csrf = require("csurf");
const router = express.Router();

const {
  allTemplatesGet,
  allTemplatesPost,
  templatesDisplayGet,
} = require("./middleware");
const path = require("path");

const csrfProtection = csrf({});

router.post(path.join("/", "all-templates"), csrfProtection, allTemplatesPost);
router.get(path.join("/", "all-templates"), csrfProtection, allTemplatesGet);
router.get(
  path.join("/", "template", ":templateId", ":language"),
  csrfProtection,
  templatesDisplayGet,
);

module.exports = router;
