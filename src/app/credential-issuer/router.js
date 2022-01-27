const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  getSharedAttributesJwt,
  buildCredentialIssuerRedirectURL,
  redirectToAuthorize,
  redirectToDebugPage,
  sendParamsToAPI,
} = require("./middleware");

router.get("/authorize", getSharedAttributesJwt, buildCredentialIssuerRedirectURL, redirectToAuthorize);
router.get(
  "/callback",
  addCallbackParamsToRequest,
  sendParamsToAPI,
  redirectToDebugPage
);

module.exports = router;
