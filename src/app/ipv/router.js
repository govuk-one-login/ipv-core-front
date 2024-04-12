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
const { getRoutePath } = require("../../lib/paths");
const PAGES = require("../../constants/ipvPages");
const path = require("path");

const csrfProtection = csrf({});
const parseForm = bodyParser.urlencoded({ extended: false });

router.get(
  path.join("/", "usefeatureset"),
  validateFeatureSet,
  renderFeatureSetPage,
);

router.get(
  path.join("/", "page", "attempt-recovery"),
  csrfProtection,
  renderAttemptRecoveryPage,
);
router.get(
  path.join("/", "page", ":pageId"),
  csrfProtection,
  handleJourneyPage,
);
// Remove this as part of PYIC-4278
router.get(path.join("/", "all-templates"), allTemplatesMoved);

router.get(
  path.join("/", "app-redirect", ":specifiedPhoneType"),
  handleAppStoreRedirect,
);

router.post(
  getRoutePath(":pageId"),
  parseForm,
  csrfProtection,
  formRadioButtonChecked,
  handleJourneyAction,
);

router.get(path.join("/", "journey", ":pageId", ":action"), updateJourneyState);
module.exports = router;
