const express = require("express");

const router = express.Router();

const {
  setIpvSessionId,
  setDebugJourneyType,
  setRealJourneyType,
} = require("./middleware");

const { handleJourneyAction } = require("../ipv/middleware");

router.get(
  "/debug-authorize",
  setDebugJourneyType,
  setIpvSessionId,
  handleJourneyAction
);

router.get(
  "/authorize",
  setRealJourneyType,
  setIpvSessionId,
  handleJourneyAction
);

module.exports = router;
