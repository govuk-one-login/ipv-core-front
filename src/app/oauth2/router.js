const express = require("express");

const router = express.Router();

const {
  redirectToCallback,
  redirectToDebugPage,
  redirectToJourney,
  retrieveAuthorizationCode,
  setIpvSessionId, setDebugJourneyType, setRealJourneyType,
} = require("./middleware");

router.get(
  "/debug-authorize",
  setDebugJourneyType,
  setIpvSessionId,
  redirectToDebugPage
);

router.get(
  "/authorize",
  setRealJourneyType,
  setIpvSessionId,
  redirectToJourney
);

router.post("/authorize", retrieveAuthorizationCode, redirectToCallback);

module.exports = router;
