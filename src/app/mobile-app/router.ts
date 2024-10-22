import express from "express";
import csrf from "csurf";
import { checkMobileAppDetails } from "./middleware";

const router = express.Router();
const csrfProtection = csrf({});

router.get("/callback", csrfProtection, checkMobileAppDetails);

module.exports = router;
