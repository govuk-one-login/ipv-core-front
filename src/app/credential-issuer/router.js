const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  sendParamsToAPI,
  tryHandleRedirectError
} = require("./middleware");

const { buildCredentialIssuerRedirectURL, redirectToAuthorize } = require('../shared/criHelper');
const { getSharedAttributesJwt } = require('../shared/sharedAttributeHelper');

router.get("/authorize", getSharedAttributesJwt, buildCredentialIssuerRedirectURL, redirectToAuthorize);

router.get(
  "/callback",
  tryHandleRedirectError,
  addCallbackParamsToRequest,
  sendParamsToAPI
);

module.exports = router;
