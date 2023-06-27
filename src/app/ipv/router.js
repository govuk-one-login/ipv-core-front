const express = require("express");
const csrf = require("csurf");
const bodyParser = require("body-parser");
const router = express.Router();

const {
  renderAttemptRecoveryPage,
  updateJourneyState,
  handleJourneyPage,
  handleJourneyAction,
  handleMultipleDocCheck,
  renderFeatureSetPage,
  validateFeatureSet,
  handlePendingPageOptions,
} = require("./middleware");

const csrfProtection = csrf({});
const parseForm = bodyParser.urlencoded({ extended: false });

router.get("/usefeatureset", validateFeatureSet, renderFeatureSetPage);

router.get("/page/attempt-recovery", csrfProtection, renderAttemptRecoveryPage);
router.get("/page/:pageId", csrfProtection, handleJourneyPage);
router.post(
  "/page/page-multiple-doc-check",
  parseForm,
  csrfProtection,
  handleMultipleDocCheck
);
router.post(
  "/page/page-ipv-pending",
  parseForm,
  csrfProtection,
  handlePendingPageOptions
);
router.post("/page/:pageId", parseForm, csrfProtection, handleJourneyAction);
router.get("/*", updateJourneyState);

module.exports = router;
