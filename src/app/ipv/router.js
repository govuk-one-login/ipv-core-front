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
} = require("./middleware");

// Remove this as part of PYIC-4278
const { allTemplatesMoved } = require("../development/middleware");

const csrfProtection = csrf({});
const parseForm = bodyParser.urlencoded({ extended: false });

function checkLanguage(req, res, next) {
  const lang = req.cookies.lng;

  // Set the flag "isWelsh" to true if the language is Welsh, otherwise set to false
  res.locals.isWelsh = lang === "cy";

  next();
}

router.get("/usefeatureset", validateFeatureSet, renderFeatureSetPage);

router.get("/page/attempt-recovery", csrfProtection, renderAttemptRecoveryPage);
router.get("/page/:pageId", csrfProtection, checkLanguage, handleJourneyPage);
// Remove this as part of PYIC-4278
router.get("/all-templates", allTemplatesMoved);

router.post(
  "/page/pyi-new-details",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);
router.post(
  "/page/pyi-confirm-delete-details",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);
router.post(
  "/page/page-ipv-identity-document-start",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);
router.post(
  "/page/page-ipv-identity-postoffice-start",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);
router.post(
  "/page/page-multiple-doc-check",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleMultipleDocCheck,
);
router.post(
  "/page/pyi-escape",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
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
  "/page/pyi-cri-escape-no-f2f",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);
router.post(
  "/page/pyi-f2f-technical",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
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
  "/page/pyi-suggest-other-options-no-f2f",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);
router.post(
  "/page/pyi-post-office",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);
router.post(
  "/page/page-ipv-bank-account-start",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);
router.post("/page/:pageId", parseForm, csrfProtection, handleJourneyAction);
router.get("/*", updateJourneyState);
module.exports = router;
