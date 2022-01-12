const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  buildCredentialIssuerStubRedirectURL,
  redirectToAuthorize,
  redirectToDebugPage,
  sendParamsToAPI,
} = require("./middleware");

router.get("/authorize", buildCredentialIssuerStubRedirectURL, redirectToAuthorize);
router.get(
  "/callback",
  addCallbackParamsToRequest,
  sendParamsToAPI,
  redirectToDebugPage
);

module.exports = router;
