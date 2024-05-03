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
  formHandleUpdateDetailsCheckBox,
  formRadioButtonChecked,
  handleAppStoreRedirect,
} = require("./middleware");

const {
  PYI_ATTEMPT_RECOVERY,
  UPDATE_DETAILS,
} = require("../../constants/ipv-pages");

const csrfProtection = csrf({});
const parseForm = bodyParser.urlencoded({ extended: false });

function getPagePath(pageId) {
  return `/page/${pageId}`;
}

router.get("/usefeatureset", validateFeatureSet, renderFeatureSetPage);

router.get(
  getPagePath(PYI_ATTEMPT_RECOVERY),
  csrfProtection,
  renderAttemptRecoveryPage,
);

router.get(getPagePath(":pageId"), csrfProtection, handleJourneyPage);

router.get("/app-redirect/:specifiedPhoneType", handleAppStoreRedirect);

// Special case to handle determination of COI journey type based in the checkboxes selected
router.post(
  getPagePath(UPDATE_DETAILS),
  parseForm,
  csrfProtection,
  formHandleUpdateDetailsCheckBox,
  formRadioButtonChecked,
  handleJourneyAction,
);

router.post(
  getPagePath(":pageId"),
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);

router.get("/journey/:pageId/:action", updateJourneyState);
module.exports = router;
