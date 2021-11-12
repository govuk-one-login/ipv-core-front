const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("index");
});

router.get("/index-hmpo", (req, res) => {
  res.render("index-hmpo");
});

module.exports = router;
