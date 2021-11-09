const BaseController = require("hmpo-form-wizard").Controller;
const jwt = require("jsonwebtoken");
const axios = require("axios");

const backendATP = process.env.BASIC_INFO_API ||
  "https://di-ipv-generic-atp-service.london.cloudapps.digital/process";

class DoneController extends BaseController {
  async saveValues(req, res, next) {
    const validity = (req.sessionModel.get("checkResult") === "clear") ? 4 : 0

    const verificationData = {
      type: "SELFIE_CHECK",
      strength: 4,
      validity: validity,
      attributes: {
        // what are the report attributes we want to put in here?
        // also if it doesn't clear, then what do we want to send back'
        check: req.sessionModel.get('check')
      },
    };

    const { data: output } = await axios.post(backendATP, verificationData);
    const decoded = jwt.decode(output);

    verificationData.validation = {
      genericDataVerified: decoded.genericDataVerified,
    };

    verificationData.jws = output;
    verificationData.atpResponse = decoded;

    const identityVerification = {
      type: verificationData.type,
      verificationData,
    }

    req.session.sessionData = req.session.sessionData || {};
    req.session.sessionData.identityVerification = req.session.sessionData.identityVerification || [];
    req.session.sessionData.identityVerification.push(identityVerification);

    super.saveValues(req, res, next);
  }
}

module.exports = DoneController;
