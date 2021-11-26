
const express = require("express");
const redirectToAuthorize = require("./middleware");

const router = express.Router();

router.get("/authorize", redirectToAuthorize)

module.exports = router