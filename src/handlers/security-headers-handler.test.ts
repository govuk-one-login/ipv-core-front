import { expect } from "chai";
import sinon from "sinon";
import {
  securityHeadersHandler,
  cspHandler,
} from "../../src/handlers/security-headers-handler";
import {
  specifyCreateRequest,
  specifyCreateResponse,
} from "../test-utils/mock-express";

describe("Security headers handler", () => {
  // Mock handler parameters
  const createRequest = specifyCreateRequest();
  const createResponse = specifyCreateResponse();
  const next: any = sinon.fake();

  beforeEach(() => {
    next.resetHistory();
  });

  it("should add security headers to response", () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();

    // Act
    securityHeadersHandler(req, res, next);

    // Assert
    expect(res.set).to.have.been.calledOnce;
    expect(res.set).to.have.been.calledWith({
      "Strict-Transport-Security": "max-age=31536000",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "0",
      "X-Content-Type-Options": "nosniff",
    });
    expect(next).to.have.been.calledOnce;
  });

  it("should remove express powered by header from response", () => {
    // Arrange
    const req = createRequest();
    const res = createResponse();

    // Act
    securityHeadersHandler(req, res, next);

    // Assert
    expect(res.removeHeader).to.have.been.calledOnce;
    expect(res.removeHeader).to.have.been.calledWith("X-Powered-By");
    expect(next).to.have.been.calledOnce;
  });

  it("should add csp header to response", () => {
    // Arrange
    const req = createRequest();
    const testNonce = "test-nonce";
    const res = createResponse({
      locals: { cspNonce: testNonce },
    });

    // Act
    cspHandler(req, res, next);

    // Assert
    expect(res.set).to.have.been.calledOnce;
    expect(res.set).to.have.been.calledWith({
      "Content-Security-Policy":
        "object-src 'none'; " +
        `script-src 'nonce-${testNonce}' 'unsafe-inline' 'strict-dynamic' https:; ` +
        "base-uri 'none'",
    });
    expect(next).to.have.been.calledOnce;
  });
});
