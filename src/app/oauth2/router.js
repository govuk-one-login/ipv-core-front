const express = require("express");

const router = express.Router();

const { setIpvSessionId, handleOAuthJourneyAction } = require("./middleware");

router.get("/authorize", setIpvSessionId, handleOAuthJourneyAction);

module.exports = router;
