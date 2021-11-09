const done = require("./controllers/done");
const passportDetails = require("./controllers/passport-details");
module.exports = {
  "/": {
    resetJourney: true,
    entryPoint: true,
    skip: true,
    next: "passport-details",
  },
  "/passport-details": {
    fields: [
      "passportNumber",
      "surname",
      "givenNames",
      "dateOfBirth",
      "issueDate",
      "expiryDate",
    ],
    controller: passportDetails,
    next: "done",
  },
  "/done": {
    controller: done,
    skip: true,
    next: "/ipv/next?source=selfie",
  },
};
