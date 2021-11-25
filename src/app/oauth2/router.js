const express = require("express");

const router = express.Router();

const {
  addAuthParamsToSession,
  redirectToCallback,
  renderOauthPage,
  retrieveAuthorizationCode,
} = require("./middleware");

router.get("/authorize", addAuthParamsToSession, renderOauthPage);
router.post("/authorize", retrieveAuthorizationCode, redirectToCallback);

module.exports = router;
