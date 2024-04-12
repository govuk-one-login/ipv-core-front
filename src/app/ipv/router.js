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
  handlePageBackButton,
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

router.get("/app-redirect/:specifiedPhoneType", handleAppStoreRedirect);

router.post(
  "/page/update-name-date-birth",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  (req, res, next) =>
    handleUpdateNameDobAction(req, res, next, "update-name-date-birth"),
);
router.post(
  "/page/page-multiple-doc-check",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  (req, res, next) =>
    handleMultipleDocCheck(req, res, next, "page-multiple-doc-check"),
);
router.post(
  "/page/pyi-cri-escape",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  (req, res, next) => handleEscapeAction(req, res, next, "pyi-cri-escape"),
);
router.post(
  "/page/pyi-suggest-other-options",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  (req, res, next) =>
    handleEscapeAction(req, res, next, "pyi-suggest-other-options"),
);
router.post(
  "/page/pyi-escape-m2b",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  (req, res, next) => handleEscapeM2b(req, res, next, "pyi-escape-m2b"),
);
router.post(
  "/page/pyi-kbv-escape-m2b",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  (req, res, next) => handleEscapeAction(req, res, next, "pyi-kbv-escape-m2b"),
);
router.post(
  "/page/:pageId",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);
router.get("/page/:pageId/back", handlePageBackButton);
router.get("/*", updateJourneyState);
module.exports = router;
