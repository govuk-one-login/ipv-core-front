const express = require("express");

const router = express.Router();

const { renderDebugPage } = require("./middleware");

router.get("/", renderDebugPage);

module.exports = router;
