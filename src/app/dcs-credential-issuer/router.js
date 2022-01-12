const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  buildDcsPassportCredentialIssuerRedirectURL,
  redirectToAuthorize,
  redirectToDebugPage,
  sendParamsToAPI,
} = require("./middleware");

router.get("/authorize", buildDcsPassportCredentialIssuerRedirectURL, redirectToAuthorize);
router.get(
  "/callback",
  addCallbackParamsToRequest,
  sendParamsToAPI,
  redirectToDebugPage
);

module.exports = router;
