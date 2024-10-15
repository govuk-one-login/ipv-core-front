import { AxiosError, AxiosResponse } from "axios";
import { expect } from "chai";
import { Request } from "express";
import sinon, { SinonSpy } from "sinon";
import { transformError, logError } from "./loggerHelper";

describe("logger helper", () => {
  context("#transformError", () => {
    it("should copy error.response.status to error.status for logging consistency", () => {
      // Arrange
      const error = new AxiosError("Some error");
      error.response = { status: 400 } as AxiosResponse;

      // Act
      transformError(error);

      // Assert
      expect(error.status).to.equal(400);
    });

    it("should append messageContext to error object when provided the value", () => {
      // Arrange
      const extraMessage = "some message";
      const error = new Error("Some error");

      // Act
      transformError(error, extraMessage);

      // Assert
      expect((error as any).messageContext).to.equal(extraMessage);
    });
  });

  context("#logError", () => {
    const req: Request = {
      session: { ipvSessionId: "ipv-session-id", ipAddress: "ip-address" },
      log: { info: sinon.fake(), error: sinon.fake() },
    } as any;

    it("should append extra message to error object", () => {
      // Arrange
      const extraMessage = "some message";
      const error = new AxiosError("Some error");
      error.response = { status: 400 } as AxiosResponse;

      // Act
      logError(req, error, extraMessage);

      // Assert
      expect(error.status).to.equal(400);
      const logMessage = (req.log.error as SinonSpy).lastCall.firstArg.message;
      expect(logMessage).to.deep.equal({
        errorMessage: "Some error",
        errorMessageContext: extraMessage,
      });
    });
  });
});
