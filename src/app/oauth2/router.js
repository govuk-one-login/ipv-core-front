const express = require("express");

const router = express.Router();

const {
  redirectToJourney,
  setIpvSessionId,
  setDebugJourneyType,
  setRealJourneyType,
} = require("./middleware");

router.get(
  "/debug-authorize",
  setDebugJourneyType,
  setIpvSessionId,
  redirectToJourney
);

router.get(
  "/authorize",
  setRealJourneyType,
  setIpvSessionId,
  redirectToJourney
);

module.exports = router;
