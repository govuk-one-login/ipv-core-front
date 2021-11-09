module.exports = {
  passportNumber: {
    type: "text",
    validate: ["required"],
  },
  surname: {
    type: "text",
    validate: ["required"],
    journeyKey: "surname",
  },
  givenNames: {
    type: "text",
    validate: ["required"],
    journeyKey: "givenNames",
  },
  dateOfBirth: {
    type: "date",
    journeyKey: "dateOfBirth",
    validate: ["required", "date"],
  },
  issueDate: {
    type: "date",
    validate: ["required", "date"],
  },
  expiryDate: {
    type: "date",
    validate: ["required", "date"],
  },
};
