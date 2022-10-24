const { expect } = require("chai");
const { transformError } = require("./loggerHelper");

describe("logger helper", () => {
  describe("when error.response.status has a value", () => {
    it("should error.response.status to error.status for logging consistency", () => {
      const error = new Error("Some error");
      error.response = { status: 400 };
      transformError(error);
      expect(error.status).to.equal(400);
    });
  });

  describe("when messageContext has a value", () => {
    it("should append to error object", () => {
      const extraMessage = "some message";
      const error = new Error("Some error");
      transformError(error, extraMessage);
      expect(error.messageContext).to.equal(extraMessage);
    });
  });
});
