const express = require("express");

const router = express.Router();

const { setIpvSessionId, setIpAddress } = require("./middleware");

const { handleJourneyActionTest } = require("../ipv/middleware");

router.get(
  "/authorize",
  setIpAddress,
  setIpvSessionId,
  handleJourneyActionTest,
);

module.exports = router;
