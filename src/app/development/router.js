const express = require("express");
const router = express.Router();

const {
  allTemplatesGet,
  allTemplatesPost,
  templatesDisplayGet,
} = require("./middleware");

router.post("/all-templates", allTemplatesPost);
router.get("/all-templates", allTemplatesGet);
router.get("/template/:templateId/:language", templatesDisplayGet);

module.exports = router;
