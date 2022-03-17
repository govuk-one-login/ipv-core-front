const express = require("express");

const router = express.Router();

const { updateJourneyState, handleJourneyPage } = require("./middleware");

router.get("/journeyPage", handleJourneyPage)
router.get("/", updateJourneyState);

module.exports = router;
