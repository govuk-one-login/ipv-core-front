const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  redirectToAuthorize,
  redirectToDebugPage,
  sendParamsToAPI,
} = require("./middleware");

const { buildCredentialIssuerRedirectURL } = require('../shared/criHelper');
const { getSharedAttributesJwt } = require('../shared/sharedAttributeHelper');

router.get("/authorize", getSharedAttributesJwt, buildCredentialIssuerRedirectURL, redirectToAuthorize);

router.get(
  "/callback",
  addCallbackParamsToRequest,
  sendParamsToAPI,
  redirectToDebugPage
);

module.exports = router;
