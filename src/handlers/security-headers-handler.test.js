const { expect } = require("chai");
const sinon = require("sinon");

const {
  securityHeadersHandler,
} = require("../../src/handlers/security-headers-handler");

describe("Security headers handler", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      session: {},
      log: { info: sinon.fake(), error: sinon.fake() },
    };

    res = {
      locals: {},
      set: sinon.fake(),
      removeHeader: sinon.fake(),
    };

    next = sinon.fake();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should add security headers to response", () => {
    const testNonce = "test-nonce";

    res.locals.cspNonce = testNonce;
    securityHeadersHandler(req, res, next);

    expect(res.set).to.have.been.calledOnce;
    expect(res.set).to.have.been.calledWith({
      "Strict-Transport-Security": "max-age=31536000",
      "Content-Security-Policy":
        "object-src 'none'; " +
        `script-src 'nonce-${testNonce}' 'unsafe-inline' 'strict-dynamic' https:; ` +
        "base-uri 'none'",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "0",
      "X-Content-Type-Options": "nosniff",
    });
    expect(next).to.have.been.calledOnce;
  });

  it("should remove express powered by header from response", () => {
    securityHeadersHandler(req, res, next);
    expect(res.removeHeader).to.have.been.calledOnce;
    expect(res.removeHeader).to.have.been.calledWith("X-Powered-By");
    expect(next).to.have.been.calledOnce;
  });
});
