const { expect } = require("chai");
const { transformError, logError, logCoreBackCall } = require("./loggerHelper");
const sinon = require("sinon");
const {
  LOG_COMMUNICATION_TYPE_REQUEST,
  LOG_TYPE_JOURNEY,
} = require("./loggerConstants");
const { API_SESSION_INITIALISE } = require("../../lib/config").default;

describe("logger helper", () => {
  context("#transformError", () => {
    it("should error.response.status to error.status for logging consistency", () => {
      const error = new Error("Some error");
      error.response = { status: 400 };
      transformError(error);

      expect(error.status).to.equal(400);
    });

    it("should append messageContext to error object when provided the value", () => {
      const extraMessage = "some message";
      const error = new Error("Some error");
      transformError(error, extraMessage);

      expect(error.messageContext).to.equal(extraMessage);
    });
  });

  context("#logError", () => {
    let req;
    beforeEach(() => {
      req = {
        session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
        log: { info: sinon.fake(), error: sinon.fake() },
      };
    });

    it("should append extra message to error object", () => {
      const extraMessage = "some message";
      const error = new Error("Some error");
      error.response = { status: 400 };
      logError(req, error, extraMessage);

      expect(error.status).to.equal(400);
      expect(req.log.error.firstArg.message.errorMessageContext).to.equal(
        extraMessage,
      );
      expect(req.log.error.firstArg.message.errorMessage).to.equal(
        "Some error",
      );
    });
  });

  context("#logCoreBackCall", () => {
    let req;
    beforeEach(() => {
      req = {
        session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
        log: { info: sinon.fake(), error: sinon.fake() },
      };
    });

    it("should log message under info with the defined fields", () => {
      logCoreBackCall(req, {
        logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
        path: API_SESSION_INITIALISE,
        info: "extra info",
      });

      expect(req.log.info.firstArg.message.logCommunicationType).to.equal(
        LOG_COMMUNICATION_TYPE_REQUEST,
      );
      expect(req.log.info.firstArg.message.path).to.equal(
        API_SESSION_INITIALISE,
      );
      expect(req.log.info.firstArg.message.info).to.equal("extra info");
    });

    it("should append type onto message", () => {
      logCoreBackCall(req, {
        logCommunicationType: LOG_COMMUNICATION_TYPE_REQUEST,
        path: API_SESSION_INITIALISE,
        type: LOG_TYPE_JOURNEY,
        info: "extra info",
      });

      expect(req.log.info.firstArg.message.type).to.equal(LOG_TYPE_JOURNEY);
    });
  });
});
