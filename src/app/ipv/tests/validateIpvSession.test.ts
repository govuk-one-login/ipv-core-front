import { expect } from "chai";
import sinon from "sinon";
import { validateIpvSession } from "../middleware";
import UnauthorizedError from "../../../errors/unauthorized-error";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../../../test-utils/mock-express";

describe("validateIpvSession", () => {
  const createRequest = specifyCreateRequest();
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  beforeEach(() => {
    next.resetHistory();
  });

  it("should call next if ipvSessionId exists in session", () => {
    // Arrange
    const req = createRequest({
      session: { ipvSessionId: "valid-session-id" },
    });
    const res = createResponse();

    // Act
    validateIpvSession(req, res, next);

    // Assert
    expect(next).to.have.been.calledOnce;
  });

  it("should throw UnauthorizedError if ipvSessionId is missing", () => {
    // Arrange
    const req = createRequest({
      session: { ipvSessionId: undefined },
    });
    const res = createResponse();

    // Act & Assert
    expect(() => validateIpvSession(req, res, next)).to.throw(
      UnauthorizedError,
      "ipvSessionId is missing",
    );
  });
});
