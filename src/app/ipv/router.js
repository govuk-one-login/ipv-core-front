const express = require("express");

const router = express.Router();

router.use("/next", (req, res) => {
  // eslint-disable-next-line no-console
  console.log("IPV next");

  // FIXME: Call di-ipv-core-back to determine next form journey to display
  res.status(200).send("NEXT!");
});

router.use("/", (req, res) => {
  res.redirect("/ipv/next");
});

module.exports = router;
