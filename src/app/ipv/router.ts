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
  handleAppStoreRedirect,
  setRequestPageId,
} from "./middleware";

import {
  PYI_ATTEMPT_RECOVERY,
  UPDATE_DETAILS,
  CONFIRM_DETAILS,
  PAGE_IPV_IDENTITY_DOCUMENT_TYPES,
} from "../../constants/ipv-pages";

const parseForm = bodyParser.urlencoded({ extended: false });

const getPagePath = (pageId: string): string => {
  return `/page/${pageId}`;
};

router.get(getPagePath(PYI_ATTEMPT_RECOVERY), renderAttemptRecoveryPage);

router.get(
  getPagePath(PAGE_IPV_IDENTITY_DOCUMENT_TYPES),
  staticPageMiddleware(PAGE_IPV_IDENTITY_DOCUMENT_TYPES),
);

router.get(getPagePath(":pageId"), handleJourneyPageRequest);

// Special case to handle determination of COI journey type based on the checkboxes selected
router.post(
  getPagePath(UPDATE_DETAILS),
  parseForm,
  setRequestPageId(UPDATE_DETAILS),
  formHandleUpdateDetailsCheckBox,
  checkFormRadioButtonSelected,
  handleJourneyActionRequest,
);

// Special case to handle determination of COI journey type based on the checkboxes selected and determine the error type
router.post(
  getPagePath(CONFIRM_DETAILS),
  parseForm,
  setRequestPageId(CONFIRM_DETAILS),
  formHandleCoiDetailsCheck,
  checkFormRadioButtonSelected,
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
