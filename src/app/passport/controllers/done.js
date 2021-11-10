const BaseController = require("hmpo-form-wizard").Controller;

class DoneController extends BaseController {
  async saveValues(req, res, next) {
    const attributes = {
      passportNumber: req.sessionModel.get("passportNumber"),
      surname: req.sessionModel.get("surname"),
      forenames: req.sessionModel.get("givenNames"),
      dateOfBirth: req.sessionModel.get("dateOfBirth"),
      issueDate: req.sessionModel.get("issueDate"),
      expiryDate: req.sessionModel.get("expiryDate"),
    };

    const identityEvidence = {
      type: "PASSPORT",
      strength: 4,
      validity: 0,
      attributes: attributes,
    };

    // FIXME - Send data to backend
    // const { data: output } = await axios.post(backendATP, identityEvidence);

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(identityEvidence, null, 2));

    super.saveValues(req, res, next);
  }
}

module.exports = DoneController;
