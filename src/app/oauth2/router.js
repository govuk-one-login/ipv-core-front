const express = require("express");

const router = express.Router();

const { setIpvSessionId, setIpAddress } = require("./middleware");

const { handleJourneyAction } = require("../ipv/middleware");

router.get("/authorize", setIpAddress, setIpvSessionId, handleJourneyAction);

module.exports = router;
