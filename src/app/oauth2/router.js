const express = require("express");

const router = express.Router();

const {
  addAuthParamsToSession,
  redirectToCallback,
  redirectToDebugPage,
  retrieveAuthorizationCode,
} = require("./middleware");

router.get("/authorize", addAuthParamsToSession, redirectToDebugPage);
router.post("/authorize", retrieveAuthorizationCode, redirectToCallback);

module.exports = router;
