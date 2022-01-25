const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  getJwt,
  buildCredentialIssuerRedirectURL,
  redirectToAuthorize,
  redirectToDebugPage,
  sendParamsToAPI,
} = require("./middleware");

router.get("/authorize", getJwt, buildCredentialIssuerRedirectURL, redirectToAuthorize);
router.get(
  "/callback",
  addCallbackParamsToRequest,
  sendParamsToAPI,
  redirectToDebugPage
);

module.exports = router;
