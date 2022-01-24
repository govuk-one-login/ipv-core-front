const express = require("express");

const router = express.Router();

const { getIssuedCredentials, renderDebugPage, setCriConfig} = require("./middleware");

router.get("/", setCriConfig, getIssuedCredentials, renderDebugPage);

module.exports = router;
