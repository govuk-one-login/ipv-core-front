import express from "express";
import bodyParser from "body-parser";

const router = express.Router();

import {
  renderAttemptRecoveryPage,
  updateJourneyState,
  handleJourneyPageRequest,
  handleJourneyActionRequest,
  renderFeatureSetPage,
  staticPageMiddleware,
  validateFeatureSet,
  formHandleUpdateDetailsCheckBox,
  formHandleCoiDetailsCheck,
  checkFormRadioButtonSelected,
  checkVcReceiptStatus,
  handleAppStoreRedirect,
  setRequestPageId,
  validatePageId,
  renderProblemDifferentBrowserPage,
  handleCrossBrowserJourneyActionRequest,
} from "./middleware";

import IPV_PAGES from "../../constants/ipv-pages";
import { APP_REDIRECT_PATH } from "../../constants/common-paths";
import { csrfSynchronisedProtection } from "../../lib/csrf";

const parseForm = bodyParser.urlencoded({ extended: false });

const getPagePath = (pageId: string): string => {
  return `/page/${pageId}`;
};

router.get(
  getPagePath(IPV_PAGES.PYI_ATTEMPT_RECOVERY),
  csrfSynchronisedProtection,
  renderAttemptRecoveryPage,
);

router.get(
  getPagePath(IPV_PAGES.PAGE_IPV_IDENTITY_DOCUMENT_TYPES),
  csrfSynchronisedProtection,
  staticPageMiddleware(IPV_PAGES.PAGE_IPV_IDENTITY_DOCUMENT_TYPES),
);

router.get(
  getPagePath(IPV_PAGES.PROBLEM_DIFFERENT_BROWSER),
  csrfSynchronisedProtection,
  renderProblemDifferentBrowserPage,
);

router.get(
  getPagePath(":pageId"),
  csrfSynchronisedProtection,
  handleJourneyPageRequest,
);

// Special case to handle determination of COI journey type based on the checkboxes selected
router.post(
  getPagePath(IPV_PAGES.UPDATE_DETAILS),
  csrfSynchronisedProtection,
  parseForm,
  setRequestPageId(IPV_PAGES.UPDATE_DETAILS),
  formHandleUpdateDetailsCheckBox,
  checkFormRadioButtonSelected,
  handleJourneyActionRequest,
);

// Special case to handle determination of COI journey type based on the checkboxes selected and determine the error type
router.post(
  getPagePath(IPV_PAGES.CONFIRM_DETAILS),
  csrfSynchronisedProtection,
  parseForm,
  setRequestPageId(IPV_PAGES.CONFIRM_DETAILS),
  formHandleCoiDetailsCheck,
  checkFormRadioButtonSelected,
  handleJourneyActionRequest,
);

// Special case to handle mobile app check receipt status, non javascript browser
router.post(
  getPagePath(IPV_PAGES.CHECK_MOBILE_APP_RESULT),
  csrfSynchronisedProtection,
  parseForm,
  setRequestPageId(IPV_PAGES.CHECK_MOBILE_APP_RESULT),
  checkVcReceiptStatus,
  handleJourneyActionRequest,
);

// Special case to handle desktop download app check receipt status, non javascript browser
router.post(
  getPagePath(IPV_PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP),
  csrfSynchronisedProtection,
  parseForm,
  setRequestPageId(IPV_PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP),
  checkVcReceiptStatus,
  handleJourneyActionRequest,
);

// Special case to handle routing from problem-different-browser page
router.post(
  getPagePath(IPV_PAGES.PROBLEM_DIFFERENT_BROWSER),
  csrfSynchronisedProtection,
  parseForm,
  setRequestPageId(IPV_PAGES.PROBLEM_DIFFERENT_BROWSER),
  handleCrossBrowserJourneyActionRequest,
);

router.post(
  getPagePath(":pageId"),
  validatePageId,
  csrfSynchronisedProtection,
  parseForm,
  checkFormRadioButtonSelected,
  handleJourneyActionRequest,
);

router.get("/usefeatureset", validateFeatureSet, renderFeatureSetPage);
router.get(`/${APP_REDIRECT_PATH}/:specifiedPhoneType`, handleAppStoreRedirect);
// Enables a link in the frontend to iterate the journey state
// This is needed because some redirects must be done with links, not forms
router.get("/journey/:pageId/:action", updateJourneyState);

export default router;
