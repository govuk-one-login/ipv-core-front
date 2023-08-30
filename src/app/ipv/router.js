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
  handleCriEscapeAction,
  renderFeatureSetPage,
  validateFeatureSet,
} = require("./middleware");

const csrfProtection = csrf({});
const parseForm = bodyParser.urlencoded({ extended: false });

function checkLanguage(req, res, next) {
  const lang = req.cookies.lng;
  // Set the flag "isWelsh" to true if the language is Welsh, otherwise set to false
  res.locals.isWelsh = lang === "cy";
  next();
}

// redirect the user if they haven’t chosen a radio button option
function formRadioButtonChecked(req, res, next) {
  if (req.method === "POST" && req.body.journey === undefined) {
    return res.redirect(req.originalUrl + "?errorState=true");
  } else {
    next();
  }
}

router.get("/usefeatureset", validateFeatureSet, renderFeatureSetPage);

router.get("/page/attempt-recovery", csrfProtection, renderAttemptRecoveryPage);
router.get("/page/:pageId", csrfProtection, checkLanguage, handleJourneyPage);
router.post(
  "/page/page-multiple-doc-check",
  parseForm,
  csrfProtection,
  handleMultipleDocCheck
);
router.post(
  "/page/page-f2f-multiple-doc-check",
  parseForm,
  csrfProtection,
  handleMultipleDocCheck
);
router.post(
  "/page/pyi-cri-escape",
  parseForm,
  csrfProtection,
  handleCriEscapeAction
);

router.post(
  "/page/page-ipv-identity-document-start",
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction
);

router.post(
  "/page/:pageId",
  parseForm,
  csrfProtection,
  handleJourneyAction
);
router.get("/*", updateJourneyState);

module.exports = router;
