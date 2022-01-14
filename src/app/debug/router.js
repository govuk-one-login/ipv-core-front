const express = require("express");

const router = express.Router();

const { renderDebugPage, setCriConfig} = require("./middleware");

router.get("/", setCriConfig, renderDebugPage);

module.exports = router;
