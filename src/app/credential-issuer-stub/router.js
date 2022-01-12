const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  buildCredentialIssuerRedirectURL,
  redirectToAuthorize,
  redirectToDebugPage,
  sendParamsToAPI,
} = require("./middleware");

router.get("/authorize", buildCredentialIssuerRedirectURL, redirectToAuthorize);
router.get(
  "/callback",
  addCallbackParamsToRequest,
  sendParamsToAPI,
  redirectToDebugPage
);

module.exports = router;
