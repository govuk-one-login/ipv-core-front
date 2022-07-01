const express = require("express");

const router = express.Router();

const {
  setIpvSessionId,
  setDebugJourneyType,
  setRealJourneyType,
} = require("./middleware");

const { handleJourneyNext } = require("../ipv/middleware");

router.get(
  "/debug-authorize",
  setDebugJourneyType,
  setIpvSessionId,
  handleJourneyNext
);

router.get(
  "/authorize",
  setRealJourneyType,
  setIpvSessionId,
  handleJourneyNext
);

module.exports = router;
