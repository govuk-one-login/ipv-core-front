const express = require("express");

const router = express.Router();

const {
  addCallbackParamsToRequest,
  getSharedAttributesJwt,
  buildCredentialIssuerRedirectURL,
  redirectToAuthorize,
  sendParamsToAPI,
} = require("./middleware");

router.get("/authorize", getSharedAttributesJwt, buildCredentialIssuerRedirectURL, redirectToAuthorize);
router.get(
  "/callback",
  addCallbackParamsToRequest,
  sendParamsToAPI
);

module.exports = router;
