const express = require("express");

const router = express.Router();

const {
  setIpvSessionId,
  setDebugJourneyType,
  setRealJourneyType,
  setIpAddress,
  validateFeatureSet,
} = require("./middleware");

const { handleJourneyAction } = require("../ipv/middleware");

router.get(
  "/debug-authorize",
  setDebugJourneyType,
  setIpAddress,
  setIpvSessionId,
  handleJourneyAction
);

router.get(
  "/authorize",
  setRealJourneyType,
  setIpAddress,
  setIpvSessionId,
  handleJourneyAction
);

router.get("/usefeatureset", validateFeatureSet);

module.exports = router;
