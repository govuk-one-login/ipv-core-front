const express = require("express");
const csrf = require("csurf");
const bodyParser = require("body-parser");
const router = express.Router();

const {
  updateJourneyState,
  handleJourneyPage,
  handleJourneyAction,
  renderFeatureSetPage,
  validateFeatureSet,
  formHandleUpdateDetailsCheckBox,
  formHandleCoiDetailsCheck,
  formRadioButtonChecked,
  handleAppStoreRedirect,
} = require("./middleware");

const {
  UPDATE_DETAILS,
  CONFIRM_DETAILS,
} = require("../../constants/ipv-pages");

const csrfProtection = csrf({});
const parseForm = bodyParser.urlencoded({ extended: false });

function getPagePath(pageId) {
  return `/page/${pageId}`;
}

router.get("/usefeatureset", validateFeatureSet, renderFeatureSetPage);

router.get(getPagePath(":pageId"), csrfProtection, handleJourneyPage);

router.get("/app-redirect/:specifiedPhoneType", handleAppStoreRedirect);

// Special case to handle determination of COI journey type based on the checkboxes selected
router.post(
  getPagePath(UPDATE_DETAILS),
  parseForm,
  csrfProtection,
  formHandleUpdateDetailsCheckBox,
  formRadioButtonChecked,
  handleJourneyAction,
);

// Special case to handle determination of COI journey type based on the checkboxes selected and determine the error type
router.post(
  getPagePath(CONFIRM_DETAILS),
  parseForm,
  csrfProtection,
  formHandleCoiDetailsCheck,
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

// Enables a link in the frontend to iterate the journey state
// This is needed because some redirects must be done with links, not forms
router.get("/journey/:pageId/:action", updateJourneyState);

module.exports = router;
