const express = require("express");
const csrf = require("csurf");

const router = express.Router();

const { sendParamsToAPI, sendParamsToAPIV2 } = require("./middleware");
const csrfProtection = csrf({});

router.get("/callback", csrfProtection, sendParamsToAPI);
router.get("/callback/:criId", csrfProtection, sendParamsToAPIV2);

module.exports = router;
