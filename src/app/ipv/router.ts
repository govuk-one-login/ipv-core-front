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
} from "./middleware";

import IPV_PAGES from "../../constants/ipv-pages";

const parseForm = bodyParser.urlencoded({ extended: false });

const getPagePath = (pageId: string): string => {
  return `/page/${pageId}`;
};

router.get(
  getPagePath(IPV_PAGES.PYI_ATTEMPT_RECOVERY),
  renderAttemptRecoveryPage,
);

router.get(
  getPagePath(IPV_PAGES.PAGE_IPV_IDENTITY_DOCUMENT_TYPES),
  staticPageMiddleware(IPV_PAGES.PAGE_IPV_IDENTITY_DOCUMENT_TYPES),
);

router.get(getPagePath(":pageId"), handleJourneyPageRequest);

// Special case to handle determination of COI journey type based on the checkboxes selected
router.post(
  getPagePath(IPV_PAGES.UPDATE_DETAILS),
  parseForm,
  setRequestPageId(IPV_PAGES.UPDATE_DETAILS),
  formHandleUpdateDetailsCheckBox,
  checkFormRadioButtonSelected,
  handleJourneyActionRequest,
);

// Special case to handle determination of COI journey type based on the checkboxes selected and determine the error type
router.post(
  getPagePath(IPV_PAGES.CONFIRM_DETAILS),
  parseForm,
  setRequestPageId(IPV_PAGES.CONFIRM_DETAILS),
  formHandleCoiDetailsCheck,
  checkFormRadioButtonSelected,
  handleJourneyActionRequest,
);

// Special case to handle mobile app check receipt status, non javascript browser
router.post(
  getPagePath(IPV_PAGES.CHECK_MOBILE_APP_RESULT),
  parseForm,
  setRequestPageId(IPV_PAGES.CHECK_MOBILE_APP_RESULT),
  checkVcReceiptStatus,
  handleJourneyActionRequest,
);

// Special case to handle desktop download app check receipt status, non javascript browser
router.post(
  getPagePath(IPV_PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP),
  parseForm,
  setRequestPageId(IPV_PAGES.PYI_TRIAGE_DESKTOP_DOWNLOAD_APP),
  checkVcReceiptStatus,
  handleJourneyActionRequest,
);

router.post(
  getPagePath(":pageId"),
  parseForm,
  checkFormRadioButtonSelected,
  handleJourneyActionRequest,
);

router.get("/usefeatureset", validateFeatureSet, renderFeatureSetPage);
router.get("/app-redirect/:specifiedPhoneType", handleAppStoreRedirect);
// Enables a link in the frontend to iterate the journey state
// This is needed because some redirects must be done with links, not forms
router.get("/journey/:pageId/:action", updateJourneyState);

export default router;
