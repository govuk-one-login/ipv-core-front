const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  redirectToAuthorize,
  sendParamsToAPI,
} = require("./middleware");

const { buildCredentialIssuerRedirectURL } = require('../shared/criHelper');
const { getSharedAttributesJwt } = require('../shared/sharedAttributeHelper');

router.get("/authorize", getSharedAttributesJwt, buildCredentialIssuerRedirectURL, redirectToAuthorize);

router.get(
  "/callback",
  addCallbackParamsToRequest,
  sendParamsToAPI
);

module.exports = router;
