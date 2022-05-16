const express = require("express");

const router = express.Router();

const {
  redirectToDebugPage,
  redirectToJourney,
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

module.exports = router;
