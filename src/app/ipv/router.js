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
  handleEscapeM2b,
  handleEscapeAction,
  renderFeatureSetPage,
  validateFeatureSet,
  formRadioButtonChecked,
  handleUpdateNameDobAction,
  handleAppStoreRedirect,
} = require("./middleware");

// Remove this as part of PYIC-4278
const { allTemplatesMoved } = require("../development/middleware");

const csrfProtection = csrf({});
const parseForm = bodyParser.urlencoded({ extended: false });

router.get("/usefeatureset", validateFeatureSet, renderFeatureSetPage);

router.get("/page/attempt-recovery", csrfProtection, renderAttemptRecoveryPage);
router.get("/page/:pageId", csrfProtection, handleJourneyPage);
// Remove this as part of PYIC-4278
router.get("/all-templates", allTemplatesMoved);

router.get("/app-redirect/:specifiedPhoneType", handleAppStoreRedirect);

router.post(
  "/page/update-name-date-birth",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleUpdateNameDobAction,
);
router.post(
  "/page/page-multiple-doc-check",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleMultipleDocCheck,
);
router.post(
  "/page/pyi-cri-escape",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  (req, res, next) =>
    handleEscapeAction(req, res, next, "handleCriEscapeAction"),
);
router.post(
  "/page/pyi-suggest-other-options",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  (req, res, next) =>
    handleEscapeAction(req, res, next, "handleCimitEscapeAction"),
);
router.post(
  "/page/pyi-escape-m2b",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleEscapeM2b,
);
router.post(
  "/page/pyi-kbv-escape-m2b",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  (req, res, next) =>
    handleEscapeAction(req, res, next, "handleCriEscapeAction"),
);
router.post(
  "/page/:pageId",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);
router.get("/*", updateJourneyState);
module.exports = router;
