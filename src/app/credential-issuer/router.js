const express = require("express");

const router = express.Router();

const { sendParamsToAPI, sendParamsToAPIV2 } = require("./middleware");

router.get("/callback", sendParamsToAPI);

router.get("/callback/:criId", sendParamsToAPIV2);

module.exports = router;
