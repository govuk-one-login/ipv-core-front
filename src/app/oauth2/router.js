const express = require("express");

const router = express.Router();

const {
  addAuthParamsToSession,
  redirectToCallback,
  redirectToDebugPage,
  redirectToJourney,
  retrieveAuthorizationCode,
  setIpvSessionId,
} = require("./middleware");

router.get(
  "/debug-authorize",
  addAuthParamsToSession,
  setIpvSessionId,
  redirectToDebugPage
);

router.get(
  "/authorize",
  setIpvSessionId,
  redirectToJourney
);

router.post("/authorize", retrieveAuthorizationCode, redirectToCallback);

module.exports = router;
