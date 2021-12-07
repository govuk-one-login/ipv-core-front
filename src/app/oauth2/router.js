const express = require("express");

const router = express.Router();

const {
  addAuthParamsToSession,
  redirectToCallback,
  redirectToDebugPage,
  retrieveAuthorizationCode,
  setIpvSessionId,
} = require("./middleware");

router.get(
  "/authorize",
  addAuthParamsToSession,
  setIpvSessionId,
  redirectToDebugPage
);
router.post("/authorize", retrieveAuthorizationCode, redirectToCallback);

module.exports = router;
