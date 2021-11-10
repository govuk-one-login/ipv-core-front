const express = require("express");

const router = express.Router();

router.use("/", (req, res) => {
  res.redirect("/next");
});

router.use("/next", (req, res) => {
  res.status(200).send("NEXT!");
});

module.exports = router;
