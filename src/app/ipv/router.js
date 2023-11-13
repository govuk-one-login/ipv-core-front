const express = require("express");
const csrf = require("csurf");
const bodyParser = require("body-parser");
const router = express.Router();
const { ENABLE_PREVIEW } = require("../../lib/config");

const {
  renderAttemptRecoveryPage,
  updateJourneyState,
  handleJourneyPage,
  handleJourneyAction,
  handleMultipleDocCheck,
  handleCriEscapeAction,
  handleCimitEscapeAction,
  renderFeatureSetPage,
  validateFeatureSet,
  allTemplates,
} = require("./middleware");

const csrfProtection = csrf({});
const parseForm = bodyParser.urlencoded({ extended: false });

function checkLanguage(req, res, next) {
  const lang = req.cookies.lng;

  // Set the flag "isWelsh" to true if the language is Welsh, otherwise set to false
  res.locals.isWelsh = lang === "cy";

  next();
}

if (ENABLE_PREVIEW) {
  router.get("/all-templates", allTemplates);
}

router.get("/usefeatureset", validateFeatureSet, renderFeatureSetPage);

router.get("/page/attempt-recovery", csrfProtection, renderAttemptRecoveryPage);
router.get("/page/:pageId", csrfProtection, checkLanguage, handleJourneyPage);
router.post(
  "/page/page-multiple-doc-check",
  parseForm,
  csrfProtection,
  handleMultipleDocCheck,
);
router.post(
  "/page/page-f2f-multiple-doc-check",
  parseForm,
  csrfProtection,
  handleMultipleDocCheck,
);
router.post(
  "/page/pyi-cri-escape",
  parseForm,
  csrfProtection,
  handleCriEscapeAction,
);
router.post(
  "/page/pyi-suggest-other-options",
  parseForm,
  csrfProtection,
  handleCimitEscapeAction,
);
router.post("/page/:pageId", parseForm, csrfProtection, handleJourneyAction);
router.get("/*", updateJourneyState);

module.exports = router;
