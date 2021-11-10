const express = require("express");

const router = express.Router();

router.use("/", (req, res) => {
  res.redirect("/ipv");
});

module.exports = router;
