const express = require("express");
const csrf = require("csurf");
const bodyParser = require("body-parser");
const router = express.Router();

const {
  renderAttemptRecoveryPage,
  updateJourneyState,
  handleJourneyPage,
  handleJourneyAction,
  renderFeatureSetPage,
  validateFeatureSet,
  formRadioButtonChecked,
  handleAppStoreRedirect,
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
  "/page/:pageId",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);
router.get("/*", updateJourneyState);
module.exports = router;
